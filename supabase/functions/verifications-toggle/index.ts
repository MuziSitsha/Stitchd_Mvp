// POST /functions/v1/verifications-toggle  { supplier_id, decision: "verified"|"rejected" }
// Admin/super only (FR-ADMIN-02). Deliberately a manual toggle this week,
// not a document-upload/review workflow (docs/decisions.md).
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
  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", {
    p_user_id: userRes.user.id,
    p_roles: ["admin", "super"],
  });
  if (roleErr) return jsonResponse({ error: roleErr.message }, 500);
  if (!isAdmin) return jsonResponse({ error: "admin or super role required" }, 403);

  const body = await req.json().catch(() => ({}));
  const { supplier_id, decision } = body ?? {};
  if (!supplier_id || !["verified", "rejected"].includes(decision)) {
    return jsonResponse({ error: "supplier_id and decision ('verified'|'rejected') are required" }, 400);
  }

  const { data: verification, error: verErr } = await admin
    .from("verifications")
    .insert({ supplier_id, status: decision })
    .select("ref, status")
    .single();
  if (verErr) return jsonResponse({ error: verErr.message }, 500);

  const { error: supErr } = await admin
    .from("suppliers")
    .update({ verified: decision === "verified" })
    .eq("id", supplier_id);
  if (supErr) return jsonResponse({ error: supErr.message }, 500);

  return jsonResponse(verification);
});
