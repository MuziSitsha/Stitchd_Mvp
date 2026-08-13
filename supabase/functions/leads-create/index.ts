// POST /functions/v1/leads-create
// { supplier_id, requester_name, requester_phone, requester_email?, details? }
// Public — no login required, matching a "request this supplier" form.
// Not the full Quoting/Order pipeline (STITCHD-SRS-SDS.md's FR-BOOK-02 spawns
// leads from a paid order); this is the deliberately narrow Supplier Pilot
// Week path (docs/decisions.md) — a lead a supplier can act on today.
import { adminClient, jsonResponse } from "../_shared/clients.ts";
import { sendSms } from "../_shared/clickatell.ts";

Deno.serve(async (req) => {
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
    .select("id, name, phone, status")
    .eq("id", supplier_id)
    .maybeSingle();

  if (supplierErr) return jsonResponse({ error: supplierErr.message }, 500);
  if (!supplier || supplier.status !== "active") {
    return jsonResponse({ error: "supplier not found or not accepting leads" }, 404);
  }

  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .insert({ supplier_id, requester_name, requester_phone, requester_email, details })
    .select("id, ref")
    .single();

  if (leadErr) return jsonResponse({ error: leadErr.message }, 500);

  if (supplier.phone) {
    await sendSms(
      supplier.phone,
      `STITCHD: New lead from ${requester_name} (${requester_phone}). Ref ${lead.ref}. Log in to accept or decline.`,
    );
  }

  return jsonResponse({ ref: lead.ref, supplier: supplier.name }, 201);
});
