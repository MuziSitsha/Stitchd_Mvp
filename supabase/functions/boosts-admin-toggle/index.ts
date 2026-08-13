// POST /functions/v1/boosts-admin-toggle  { supplier_id }
// Admin/super only. A comped Boost — no payment, no Paystack — for the
// Operator tab's "feature toggle" and the Supplier-preview tab's Boost
// button in the internal Supplier Portal lens. Deliberately separate from
// boosts-checkout: that function derives the supplier strictly from the
// caller's own profile_id, which is wrong here (the caller is an internal
// admin acting on someone else's listing, not the supplier themselves).
// Toggle semantics: expire an active boost if one exists, else comp a new
// 7-day one — same shape webhooks-paystack's activateBoost() produces for a
// real paid boost, so downstream ranking logic can't tell the difference.
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
  const { supplier_id } = body ?? {};
  if (!supplier_id) return jsonResponse({ error: "supplier_id is required" }, 400);

  const { data: active, error: activeErr } = await admin
    .from("boosts")
    .select("id")
    .eq("supplier_id", supplier_id)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (activeErr) return jsonResponse({ error: activeErr.message }, 500);

  if (active) {
    const { error: expireErr } = await admin
      .from("boosts")
      .update({ expires_at: new Date().toISOString() })
      .eq("id", active.id);
    if (expireErr) return jsonResponse({ error: expireErr.message }, 500);
    return jsonResponse({ featured: false });
  }

  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  const { error: insertErr } = await admin.from("boosts").insert({
    supplier_id,
    amount_cents: 0,
    status: "active",
    starts_at: startsAt.toISOString(),
    expires_at: expiresAt.toISOString(),
  });
  if (insertErr) return jsonResponse({ error: insertErr.message }, 500);

  return jsonResponse({ featured: true });
});
