// POST /functions/v1/leads-reroute  { lead_ref, supplier_id }
// Ops/admin/super only (STITCHD-SRS-SDS.md §5.5: Ops gets "reroute", not
// direct accept/decline — a distinct action from leads-respond). Reassigns
// an unclaimed lead to a different supplier; the original supplier loses it.
import { adminClient, callerClient, jsonResponse } from "../_shared/clients.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return jsonResponse({ error: "missing Authorization header" }, 401);
  }

  const caller = callerClient(authHeader);
  const { data: userRes, error: userErr } = await caller.auth.getUser();
  if (userErr || !userRes.user) return jsonResponse({ error: "invalid session" }, 401);

  const admin = adminClient();
  const { data: allowed, error: roleErr } = await admin.rpc("has_role", {
    p_user_id: userRes.user.id,
    p_roles: ["ops", "admin", "super"],
  });
  if (roleErr) return jsonResponse({ error: roleErr.message }, 500);
  if (!allowed) return jsonResponse({ error: "ops, admin or super role required" }, 403);

  const body = await req.json().catch(() => ({}));
  const { lead_ref, supplier_id } = body ?? {};
  if (!lead_ref || !supplier_id) {
    return jsonResponse({ error: "lead_ref and supplier_id are required" }, 400);
  }

  const { data: supplier, error: supplierErr } = await admin
    .from("suppliers")
    .select("id, name")
    .eq("id", supplier_id)
    .maybeSingle();
  if (supplierErr) return jsonResponse({ error: supplierErr.message }, 500);
  if (!supplier) return jsonResponse({ error: "target supplier not found" }, 404);

  const { data: lead, error: leadErr } = await admin
    .from("leads")
    .update({ supplier_id })
    .eq("ref", lead_ref)
    .eq("status", "new")
    .select("ref, status")
    .maybeSingle();
  if (leadErr) return jsonResponse({ error: leadErr.message }, 400);
  if (!lead) return jsonResponse({ error: "lead not found or already responded to" }, 404);

  return jsonResponse({ ref: lead.ref, supplier: supplier.name });
});
