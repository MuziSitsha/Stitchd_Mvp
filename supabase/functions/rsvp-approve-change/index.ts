// POST /functions/v1/rsvp-approve-change
//   { guest_id, function_id, decision: 'approve'|'decline' }
// Host-only (event owner). Part F2: after the RSVP cutoff a guest's edit
// is parked as a change request — "only approval changes counts." Approve
// applies the pending_change to the counted answer; decline discards it
// and leaves the previously-submitted answer as-is.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "missing Authorization header" }, 401);
  const caller = callerClient(authHeader);
  const { data: userRes, error: userErr } = await caller.auth.getUser();
  if (userErr || !userRes.user) return jsonResponse({ error: "invalid session" }, 401);

  const body = await req.json().catch(() => ({}));
  const guestId = body?.guest_id as string | undefined;
  const functionId = body?.function_id as string | undefined;
  const decision = body?.decision as string | undefined;
  if (!guestId || !functionId || !["approve", "decline"].includes(decision ?? "")) {
    return jsonResponse({ error: "guest_id, function_id, and decision ('approve'|'decline') are required" }, 400);
  }

  const admin = adminClient();

  const { data: response, error: respErr } = await admin
    .from("guest_responses")
    .select("guest_id, function_id, state, pending_change, revision, guests(household_id, households(event_id, events(owner_id)))")
    .eq("guest_id", guestId)
    .eq("function_id", functionId)
    .maybeSingle();
  if (respErr) return jsonResponse({ error: respErr.message }, 500);
  if (!response) return jsonResponse({ error: "response not found" }, 404);
  if (response.state !== "change_requested") return jsonResponse({ error: `no change request pending (state is ${response.state})` }, 400);

  const owner = ((response.guests as unknown as { households: { events: { owner_id: string } | null } | null } | null)?.households?.events?.owner_id) ?? null;
  if (owner !== userRes.user.id) return jsonResponse({ error: "must be the owner of this guest's event" }, 403);

  const pending = (response.pending_change ?? {}) as Record<string, unknown>;

  const patch = decision === "approve"
    ? { state: "submitted", answer: pending.answer ?? null, meal: pending.meal ?? null, dietary_note: pending.dietary_note ?? null, plus_one_name: pending.plus_one_name ?? null, pending_change: null, revision: (response.revision ?? 0) + 1, updated_at: new Date().toISOString() }
    : { state: "submitted", pending_change: null, updated_at: new Date().toISOString() };

  const { error: updateErr } = await admin
    .from("guest_responses")
    .update(patch)
    .eq("guest_id", guestId)
    .eq("function_id", functionId)
    .eq("state", "change_requested");
  if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

  return jsonResponse({ guest_id: guestId, function_id: functionId, decision });
});
