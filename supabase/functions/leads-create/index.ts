// POST /functions/v1/leads-create
// { supplier_id, requester_name, requester_phone, requester_email?, details? }
// Public — no login required, matching a "request this supplier" form.
// Not the full Quoting/Order pipeline (STITCHD-SRS-SDS.md's FR-BOOK-02 spawns
// leads from a paid order); this is the deliberately narrow Supplier Pilot
// Week path (docs/decisions.md) — a lead a supplier can act on today.
import { adminClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { notify } from "../_shared/notify.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const { supplier_id, requester_name, requester_phone, requester_email, details } = body ?? {};

  if (!supplier_id || !requester_name || !requester_phone) {
    return jsonResponse({ error: "supplier_id, requester_name, and requester_phone are required" }, 400);
  }

  const admin = adminClient();

  const { data: supplier, error: supplierErr } = await admin
    .from("suppliers")
    .select("id, name, phone, status, profile_id")
    .eq("id", supplier_id)
    .maybeSingle();

  if (supplierErr) return jsonResponse({ error: supplierErr.message }, 500);
  if (!supplier || supplier.status !== "active") {
    return jsonResponse({ error: "supplier not found or not accepting leads" }, 404);
  }

  // Part K1: "Lead creation — 20 per hour per actor." An anonymous form has
  // no account to key off, so requester_phone is the actor.
  const { data: withinLimit, error: rateErr } = await admin.rpc("check_rate_limit", {
    p_bucket: "lead_creation", p_key: requester_phone, p_max_count: 20, p_window_seconds: 3600,
  });
  if (rateErr) return jsonResponse({ error: rateErr.message }, 500);
  if (!withinLimit) return jsonResponse({ error: "too many requests from this number recently — please try again later" }, 429);

  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .insert({ supplier_id, requester_name, requester_phone, requester_email, details })
    .select("id, ref")
    .single();

  if (leadErr) return jsonResponse({ error: leadErr.message }, 500);

  await notify(lead.ref, "lead_alert", { clientName: `${requester_name} (${requester_phone})`, ref: lead.ref }, supplier.phone, supplier.profile_id ?? undefined);

  return jsonResponse({ ref: lead.ref, supplier: supplier.name }, 201);
});
