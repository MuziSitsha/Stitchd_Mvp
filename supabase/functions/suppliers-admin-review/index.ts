// POST /functions/v1/suppliers-admin-review  { supplier_id, decision: 'approve'|'decline' }
// Admin/super only. Distinct from suppliers-admin-suspend — this is the
// initial "is a brand-new self-registered listing allowed to go live at
// all" gate, only operates on a currently-'pending' supplier (a listing
// that's already active/suspended/paused isn't a pending application, and
// has its own dedicated actions), and always notifies the supplier either
// way so this is the first real thing their phone number gets used for.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { notify } from "../_shared/notify.ts";

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
  const { supplier_id, decision } = body ?? {};
  if (!supplier_id || !["approve", "decline"].includes(decision)) {
    return jsonResponse({ error: "supplier_id and decision ('approve'|'decline') are required" }, 400);
  }

  const nextStatus = decision === "approve" ? "active" : "declined";

  const { data: updated, error: updateErr } = await admin
    .from("suppliers")
    .update({ status: nextStatus })
    .eq("id", supplier_id)
    .eq("status", "pending")
    .select("name, phone, profile_id, status")
    .maybeSingle();
  if (updateErr) return jsonResponse({ error: updateErr.message }, 500);
  if (!updated) return jsonResponse({ error: "supplier not found, or not currently pending review" }, 409);

  await notify(
    supplier_id, decision === "approve" ? "supplier_approved" : "supplier_declined",
    { supplierName: updated.name },
    updated.phone, updated.profile_id ?? undefined,
  );

  return jsonResponse({ status: updated.status });
});
