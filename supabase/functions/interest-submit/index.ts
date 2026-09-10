// POST /functions/v1/interest-submit
//   { kind: 'supplier'|'couple'|'other', name, email, phone?, org_name?,
//     message? }
// Public, no account. Part C1: "A separate non-account contact-interest
// form is permitted only when the Product Owner explicitly enables it. It
// must not create supplier profiles or trigger onboarding messages."
//
// So this function does exactly three things and nothing more: check the
// enable flag, rate-limit, write one interest_submissions row. No notify(),
// no supplier/lead/account creation, no side effects. A human in Ops reads
// the Admin Console and follows up out of band.
import { adminClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);

  const body = await req.json().catch(() => ({}));
  const kind = String(body?.kind ?? "").trim();
  const name = String(body?.name ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const phone = body?.phone ? String(body.phone).trim() : null;
  const orgName = body?.org_name ? String(body.org_name).trim() : null;
  const message = body?.message ? String(body.message).trim() : null;

  if (!["supplier", "couple", "other"].includes(kind)) {
    return jsonResponse({ error: "kind must be 'supplier', 'couple' or 'other'" }, 400);
  }
  if (!name || name.length > 200) return jsonResponse({ error: "a name is required" }, 400);
  if (!EMAIL_RE.test(email) || email.length > 320) return jsonResponse({ error: "a valid email is required" }, 400);
  if (message && message.length > 2000) return jsonResponse({ error: "message is too long" }, 400);

  const admin = adminClient();

  // The Product Owner's explicit switch. Closed by default; a direct API
  // call can't get past it any more than the landing page can.
  const { data: settings, error: settingsErr } = await admin
    .from("platform_settings").select("contact_interest_form_enabled").eq("id", 1).maybeSingle();
  if (settingsErr) return jsonResponse({ error: settingsErr.message }, 500);
  if (!settings?.contact_interest_form_enabled) {
    return jsonResponse({ error: "the contact form isn't open right now" }, 403);
  }

  // Anti-abuse: an anonymous form has no account to key off, so the email
  // is the actor. Same shape as leads-create's requester_phone key.
  const { data: withinLimit, error: rateErr } = await admin.rpc("check_rate_limit", {
    p_bucket: "interest_submit", p_key: email, p_max_count: 5, p_window_seconds: 3600,
  });
  if (rateErr) return jsonResponse({ error: rateErr.message }, 500);
  if (!withinLimit) return jsonResponse({ error: "we've already got a few notes from this address — we'll be in touch" }, 429);

  const { data: row, error: insertErr } = await admin
    .from("interest_submissions")
    .insert({ kind, name, email, phone, org_name: orgName, message })
    .select("ref")
    .single();
  if (insertErr) return jsonResponse({ error: insertErr.message }, 500);

  return jsonResponse({ ok: true, ref: row.ref });
});
