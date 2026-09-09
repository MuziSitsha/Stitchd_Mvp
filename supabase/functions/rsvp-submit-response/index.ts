// POST /functions/v1/rsvp-submit-response
//   { session_token, responses: [{ guest_id, function_id, answer?
//     ('attending'|'declined'), draft?, meal?, dietary_note?,
//     plus_one_name?, expected_revision }] }
// Anonymous, session-scoped — same idiom as rsvp-exchange-token. Every
// write re-validates the session against the LIVE invitations row (not
// just the cached invitation_version_at_mint), so a revoke or re-publish
// takes effect on the very next request, not just for sessions minted
// afterward. expected_revision is optimistic concurrency, matching this
// project's existing quotes/tickets pattern — a stale write returns 409
// with the current row rather than silently overwriting a newer answer
// (Part F2: "never overwrite a newer household response silently").
import { adminClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

interface ResponseInput {
  guest_id: string;
  function_id: string;
  answer?: "attending" | "declined";
  draft?: boolean;
  meal?: string | null;
  dietary_note?: string | null;
  plus_one_name?: string | null;
  expected_revision: number;
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);

  const body = await req.json().catch(() => ({}));
  const sessionToken = body?.session_token as string | undefined;
  const responses = body?.responses as ResponseInput[] | undefined;
  if (!sessionToken || !Array.isArray(responses) || responses.length === 0) {
    return jsonResponse({ error: "session_token and a non-empty responses array are required" }, 400);
  }

  const admin = adminClient();
  const sessionHash = await sha256Hex(sessionToken);

  const { data: session, error: sessionErr } = await admin
    .from("guest_sessions")
    .select("household_id, invitation_version_at_mint, expires_at")
    .eq("session_token_hash", sessionHash)
    .maybeSingle();
  if (sessionErr) return jsonResponse({ error: sessionErr.message }, 500);
  if (!session) return jsonResponse({ error: "session expired or invalid — please reopen your invitation link" }, 401);
  if (new Date(session.expires_at).getTime() < Date.now()) {
    return jsonResponse({ error: "session expired or invalid — please reopen your invitation link" }, 401);
  }

  const { data: invitation, error: invErr } = await admin
    .from("invitations")
    .select("token_version, state")
    .eq("household_id", session.household_id)
    .single();
  if (invErr || !invitation) return jsonResponse({ error: invErr?.message ?? "invitation not found" }, 500);
  if (invitation.state !== "published" || invitation.token_version !== session.invitation_version_at_mint) {
    return jsonResponse({ error: "this invitation has changed since you opened it — please reopen your link" }, 401);
  }

  // Part K1: "RSVP writes — 30 per 10 minutes per invitation + IP." Keyed
  // by household_id alone (this project's stand-in for "the invitation") —
  // combining it with a caller IP would need Deno's forwarded-header
  // handling to be reliable across every deployment topology this runs
  // under, which isn't attempted in this pass; stated as a real
  // simplification, not silently narrowed.
  const { data: withinLimit, error: rateErr } = await admin.rpc("check_rate_limit", {
    p_bucket: "rsvp_write", p_key: session.household_id, p_max_count: 30, p_window_seconds: 600,
  });
  if (rateErr) return jsonResponse({ error: rateErr.message }, 500);
  if (!withinLimit) return jsonResponse({ error: "too many attempts — please wait a few minutes and try again" }, 429);

  // Every guest_id in the payload must actually belong to this session's
  // household — the household_id in the session is the only thing this
  // request is allowed to touch, regardless of what guest_id a tampered
  // client sends.
  const { data: householdGuests, error: guestsErr } = await admin.from("guests").select("id").eq("household_id", session.household_id);
  if (guestsErr) return jsonResponse({ error: guestsErr.message }, 500);
  const validGuestIds = new Set((householdGuests ?? []).map((g) => g.id));
  const forgedGuestId = responses.find((r) => !validGuestIds.has(r.guest_id));
  if (forgedGuestId) return jsonResponse({ error: "one or more guests in this request don't belong to your household" }, 403);

  const results: Array<{ guest_id: string; function_id: string; state: string; revision: number } | { guest_id: string; function_id: string; conflict: true; current: unknown }> = [];

  for (const r of responses) {
    const { data: entitlement } = await admin
      .from("guest_entitlements")
      .select("plus_one_allowed")
      .eq("guest_id", r.guest_id)
      .eq("function_id", r.function_id)
      .maybeSingle();
    if (!entitlement) return jsonResponse({ error: `guest ${r.guest_id} is not entitled to function ${r.function_id}` }, 403);

    const nextState = r.draft ? "draft" : "submitted";
    // "Attending guests see meal questions; declined guests skip them" —
    // enforced here too, not just hidden by the UI: a declined answer
    // never carries a meal choice through to storage.
    const attending = r.answer === "attending";

    const { data: updated, error: updateErr } = await admin
      .from("guest_responses")
      .update({
        state: nextState,
        answer: r.answer ?? null,
        meal: attending ? r.meal ?? null : null,
        dietary_note: attending ? r.dietary_note ?? null : null,
        plus_one_name: attending && entitlement.plus_one_allowed ? r.plus_one_name ?? null : null,
        revision: r.expected_revision + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("guest_id", r.guest_id)
      .eq("function_id", r.function_id)
      .eq("revision", r.expected_revision)
      .select("guest_id, function_id, state, revision")
      .maybeSingle();
    if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

    if (!updated) {
      const { data: current } = await admin
        .from("guest_responses")
        .select("state, answer, revision")
        .eq("guest_id", r.guest_id)
        .eq("function_id", r.function_id)
        .maybeSingle();
      results.push({ guest_id: r.guest_id, function_id: r.function_id, conflict: true, current });
      continue;
    }
    results.push(updated);
  }

  // Recompute counts for every function touched, live — "A completed
  // response immediately updates host counts." Function count = distinct
  // attending entitled guests, never a sum across functions.
  const functionIds = [...new Set(responses.map((r) => r.function_id))];
  const counts: Record<string, number> = {};
  for (const fid of functionIds) {
    const { count } = await admin
      .from("guest_responses")
      .select("id", { count: "exact", head: true })
      .eq("function_id", fid)
      .eq("answer", "attending")
      .eq("state", "submitted");
    counts[fid] = count ?? 0;
  }

  // Always 200: a single batch can have some responses succeed and others
  // conflict, so "conflict" is a per-item flag in `results`, not an
  // overall HTTP status — and this project's shared callFunction() helper
  // discards the response body on any non-2xx status, which would have
  // silently thrown away the very results the caller needs to react to.
  return jsonResponse({ results, counts });
});
