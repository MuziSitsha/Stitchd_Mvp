// POST /functions/v1/refund-request-large  { order_ref, reason, amount_cents }
// Admin/super only. Creates a pending approval — moves no money. The
// separate step (refund-approve-large) requires a second, different admin
// before anything is actually refunded via Paystack.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";

const REFUND_CEILING_CENTS = 1_000_000; // R10,000 — must match payments-refund's own ceiling

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  if (req.method !== "POST") return jsonResponse({ error: "POST only" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return jsonResponse({ error: "missing Authorization header" }, 401);
  const caller = callerClient(authHeader);
  const { data: userRes, error: userErr } = await caller.auth.getUser();
  if (userErr || !userRes.user) return jsonResponse({ error: "invalid session" }, 401);

  const admin = adminClient();
  const { data: isAdmin, error: roleErr } = await admin.rpc("has_role", { p_user_id: userRes.user.id, p_roles: ["admin", "super"] });
  if (roleErr) return jsonResponse({ error: roleErr.message }, 500);
  if (!isAdmin) return jsonResponse({ error: "admin or super role required" }, 403);

  const body = await req.json().catch(() => ({}));
  const orderRef = body?.order_ref as string | undefined;
  const reason = body?.reason as string | undefined;
  const amountCents = body?.amount_cents as number | undefined;
  if (!orderRef || !reason?.trim() || !amountCents) {
    return jsonResponse({ error: "order_ref, reason, and amount_cents are required" }, 400);
  }
  if (amountCents <= REFUND_CEILING_CENTS) {
    return jsonResponse({ error: `amounts at or below R${REFUND_CEILING_CENTS / 100} should go through payments-refund directly` }, 400);
  }

  const { data: order, error: orderErr } = await admin.from("orders").select("id, status, total_cents").eq("ref", orderRef).maybeSingle();
  if (orderErr) return jsonResponse({ error: orderErr.message }, 500);
  if (!order) return jsonResponse({ error: "order not found" }, 404);
  if (order.status !== "paid") return jsonResponse({ error: `cannot refund an order that is ${order.status}` }, 400);
  if (amountCents > order.total_cents) return jsonResponse({ error: `cannot refund ${amountCents} cents against an order paid for ${order.total_cents}` }, 400);

  const { data: created, error: insertErr } = await admin
    .from("large_refund_approvals")
    .insert({ order_id: order.id, amount_cents: amountCents, reason: reason.trim(), requested_by: userRes.user.id })
    .select("ref, status")
    .single();
  if (insertErr) {
    if (insertErr.message.includes("large_refund_approvals_one_pending_per_order")) {
      return jsonResponse({ error: "a large-refund request is already pending for this order" }, 409);
    }
    return jsonResponse({ error: insertErr.message }, 500);
  }

  return jsonResponse(created);
});
