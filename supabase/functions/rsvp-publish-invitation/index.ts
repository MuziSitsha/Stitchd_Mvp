// POST /functions/v1/rsvp-publish-invitation  { household_id }
// Host-only. Mints a fresh 256-bit token, stores only its SHA-256 hash
// (Part F2: "Generate at least 256-bit random invitation tokens. Store
// only the hash and expiry"), and returns the raw token exactly once — the
// host is expected to copy it into their own send channel. Re-publishing
// an already-published household bumps token_version, which immediately
// invalidates every guest_session minted under the old version (checked
// live on every rsvp-submit-response call, not just at mint time) —
// "Reissued tokens invalidate previous sessions on the next request via
// invitation version."
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";

const INVITATION_TTL_DAYS = 180;

function randomToken(): string {
  const bytes = new Uint8Array(32); // 256 bits
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

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
  const householdId = body?.household_id as string | undefined;
  if (!householdId) return jsonResponse({ error: "household_id is required" }, 400);

  const admin = adminClient();

  const { data: owning, error: ownErr } = await admin
    .from("households")
    .select("id, events!inner(owner_id)")
    .eq("id", householdId)
    .eq("events.owner_id", userRes.user.id)
    .maybeSingle();
  if (ownErr) return jsonResponse({ error: ownErr.message }, 500);
  if (!owning) return jsonResponse({ error: "must be the owner of this household's event" }, 403);

  const { data: current, error: currentErr } = await admin
    .from("invitations")
    .select("token_version")
    .eq("household_id", householdId)
    .maybeSingle();
  if (currentErr) return jsonResponse({ error: currentErr.message }, 500);

  const rawToken = randomToken();
  const tokenHash = await sha256Hex(rawToken);
  const expiresAt = new Date(Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateErr } = await admin
    .from("invitations")
    .update({
      token_hash: tokenHash,
      token_version: (current?.token_version ?? 0) + 1,
      state: "published",
      expires_at: expiresAt,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("household_id", householdId);
  if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

  return jsonResponse({ token: rawToken, expires_at: expiresAt });
});
