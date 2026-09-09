// POST /functions/v1/rsvp-exchange-token  { token }
// Anonymous — a guest has no Supabase Auth account at all. Same "service
// role does the real check, zero client-facing RLS" idiom as lead-messages.
// Hashes the raw invite token and looks it up by hash (never stores or
// logs the raw value), mints a short-lived opaque session, and returns the
// household's guests/entitlements/current responses in the same call —
// "a guest taps a link, sees their own household already recognised" in
// one round trip. The session is deliberately not a browser HttpOnly
// cookie: this SPA (Vercel) and this function (Supabase) are different
// origins, and the rest of this app's own Supabase Auth sessions already
// persist client-side rather than via HttpOnly cookies, so this matches
// the existing trust model instead of a stricter-on-paper mechanism this
// stack doesn't naturally support.
import { adminClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";

const SESSION_TTL_HOURS = 24;

function randomToken(): string {
  const bytes = new Uint8Array(32);
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

  const body = await req.json().catch(() => ({}));
  const token = body?.token as string | undefined;
  if (!token) return jsonResponse({ error: "token is required" }, 400);

  const admin = adminClient();
  const tokenHash = await sha256Hex(token);

  const { data: invitation, error: invErr } = await admin
    .from("invitations")
    .select("id, household_id, token_version, state, expires_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (invErr) return jsonResponse({ error: invErr.message }, 500);

  // Generic message either way — never confirm/deny which reason applied,
  // matching this project's existing no-enumeration discipline (Part
  // C1's sign-up flow uses the same idea for existing-email cases).
  const invalid = () => jsonResponse({ error: "this invitation link is invalid or has expired" }, 404);
  if (!invitation || invitation.state !== "published") return invalid();
  if (invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now()) return invalid();

  const sessionToken = randomToken();
  const sessionHash = await sha256Hex(sessionToken);
  const sessionExpiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000).toISOString();

  const { error: sessionErr } = await admin.from("guest_sessions").insert({
    household_id: invitation.household_id,
    session_token_hash: sessionHash,
    invitation_version_at_mint: invitation.token_version,
    expires_at: sessionExpiresAt,
  });
  if (sessionErr) return jsonResponse({ error: sessionErr.message }, 500);

  const { data: household, error: hErr } = await admin.from("households").select("id, label").eq("id", invitation.household_id).single();
  if (hErr || !household) return jsonResponse({ error: hErr?.message ?? "household not found" }, 500);

  const { data: guests, error: gErr } = await admin
    .from("guests")
    .select("id, display_name, person_type, guest_entitlements(function_id, plus_one_allowed, functions(id, name, starts_at, location)), guest_responses(function_id, state, answer, meal, dietary_note, plus_one_name, revision)")
    .eq("household_id", household.id);
  if (gErr) return jsonResponse({ error: gErr.message }, 500);

  return jsonResponse({
    session_token: sessionToken,
    session_expires_at: sessionExpiresAt,
    household,
    guests: guests ?? [],
  });
});
