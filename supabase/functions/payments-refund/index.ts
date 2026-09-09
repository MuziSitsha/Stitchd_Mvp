// POST /functions/v1/payments-refund  { order_ref, reason, amount_cents? }
// Admin/super only. Closes the audit gap: the dispute/support ticket
// workflow could reach "resolved" with no path that actually moves money
// back. Real Paystack test-mode refund against the order's own provider_ref
// — same "genuinely real" bar every other checkout/refund call in this
// codebase is held to.
//
// WBS-06 (Part K1 / T-PAY-04): a refund above REFUND_CEILING_CENTS is
// refused here — the caller is pointed at refund-request-large instead,
// which requires a second, different admin to approve before any money
// moves. Below the ceiling this function's behaviour is byte-for-byte
// unchanged from before, since it's already verified live in production.
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { refundTransaction } from "../_shared/paystack.ts";

const REFUND_CEILING_CENTS = 1_000_000; // R10,000

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
  const orderRef = body?.order_ref as string | undefined;
  const reason = body?.reason as string | undefined;
  const amountCents = body?.amount_cents as number | undefined;
  if (!orderRef || !reason?.trim()) return jsonResponse({ error: "order_ref and reason are required" }, 400);

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, status, provider_ref, total_cents")
    .eq("ref", orderRef)
    .maybeSingle();
  if (orderErr) return jsonResponse({ error: orderErr.message }, 500);
  if (!order) return jsonResponse({ error: "order not found" }, 404);
  if (order.status !== "paid") return jsonResponse({ error: `cannot refund an order that is ${order.status}` }, 400);
  if (!order.provider_ref) return jsonResponse({ error: "order has no payment reference to refund" }, 400);

  const requestedAmount = amountCents ?? order.total_cents;
  if (requestedAmount > order.total_cents) {
    return jsonResponse({ error: `cannot refund ${requestedAmount} cents against an order paid for ${order.total_cents}` }, 400);
  }
  if (requestedAmount > REFUND_CEILING_CENTS) {
    return jsonResponse({
      error: `refunds over R${REFUND_CEILING_CENTS / 100} require a second admin's approval — use refund-request-large instead`,
      requires_large_refund_approval: true,
    }, 400);
  }

  let paystackResult: { status: string; refundId: number };
  try {
    paystackResult = await refundTransaction(order.provider_ref, amountCents);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin.from("refunds").insert({
      order_id: order.id, amount_cents: amountCents ?? order.total_cents, reason,
      status: "failed", actor_id: userRes.user.id,
    });
    return jsonResponse({ error: message }, 502);
  }

  const { data: refund, error: refundErr } = await admin
    .from("refunds")
    .insert({
      order_id: order.id,
      amount_cents: amountCents ?? order.total_cents,
      reason,
      status: "processed",
      paystack_refund_id: String(paystackResult.refundId),
      actor_id: userRes.user.id,
    })
    .select("ref")
    .single();
  if (refundErr) return jsonResponse({ error: refundErr.message }, 500);

  const { error: updateErr } = await admin.from("orders").update({ status: "refunded" }).eq("id", order.id);
  if (updateErr) return jsonResponse({ error: updateErr.message }, 500);

  return jsonResponse({ ref: refund.ref, order_ref: orderRef, status: "refunded" });
});
