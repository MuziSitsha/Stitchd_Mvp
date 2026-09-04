// POST /functions/v1/promotions-admin-moderate  { promotion_ref, action: 'unpublish' }
// Admin/super only — the doc's "unpublish anything inappropriate" role.
// Supplier self-publishes directly via RLS; this is only for a cross-actor
// admin write on someone else's row, same idiom as suppliers-admin-suspend.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "missing Authorization header" }, 401);

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
  const promotionRef = body?.promotion_ref as string | undefined;
  const action = body?.action as string | undefined;
  if (!promotionRef || action !== "unpublish") {
    return jsonResponse({ error: "promotion_ref and action ('unpublish') are required" }, 400);
  }

  const { data: updated, error: updateErr } = await admin
    .from("promotions")
    .update({ status: "unpublished", updated_at: new Date().toISOString() })
    .eq("ref", promotionRef)
    .select("ref, status")
    .maybeSingle();
  if (updateErr) return jsonResponse({ error: updateErr.message }, 500);
  if (!updated) return jsonResponse({ error: "promotion not found" }, 404);

  return jsonResponse(updated);
});
