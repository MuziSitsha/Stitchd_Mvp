// POST /functions/v1/suppliers-admin-suspend  { supplier_id, suspend: boolean }
// Admin/super only. Distinct from the supplier's own self-service active/
// paused toggle (SupplierPortal.tsx's toggleListingStatus) — suspend:true
// force-sets 'suspended' regardless of current status; suspend:false
// reinstates to 'active'. A suspended supplier can't undo it themselves.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

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
  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
    p_user_id: userRes.user.id,
    p_roles: ["admin", "super"],
  });
  if (roleErr) return jsonResponse({ error: roleErr.message }, 500);
  if (!isAdmin) return jsonResponse({ error: "admin or super role required" }, 403);

  const body = await req.json().catch(() => ({}));
  const { supplier_id, suspend } = body ?? {};
  if (!supplier_id || typeof suspend !== "boolean") {
    return jsonResponse({ error: "supplier_id and suspend (boolean) are required" }, 400);
  }

  const { data: updated, error: updateErr } = await admin
    .from("suppliers")
    .update({ status: suspend ? "suspended" : "active" })
    .eq("id", supplier_id)
    .select("status")
    .single();
  if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

  return jsonResponse(updated);
});
