// POST /functions/v1/refund-approve-large  { request_ref, decision: 'approved'|'declined' }
// Admin/super only, and must be a different admin than whoever requested
// it — "no self-approved refund" enforced as an actual rejected request,
// not just a documented policy. Approval executes the real Paystack
// refund in the same step (the money-moving logic is intentionally
// duplicated from payments-refund rather than calling it internally, so
// this function's own authorization — already-verified separation — is
// what gates the Paystack call, not a second function's unrelated checks).
import { adminClient, callerClient, handlePreflight, jsonResponse } from "../_shared/clients.ts";
import { refundTransaction } from "../_shared/paystack.ts";

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
  const requestRef = body?.request_ref as string | undefined;
  const decision = body?.decision as string | undefined;
  if (!requestRef || !["approved", "declined"].includes(decision ?? "")) {
    return jsonResponse({ error: "request_ref and decision ('approved'|'declined') are required" }, 400);
  }

  const { data: request, error: reqErr } = await admin
    .from("large_refund_approvals")
    .select("id, status, order_id, amount_cents, reason, requested_by, orders(ref, provider_ref, status, total_cents)")
    .eq("ref", requestRef)
    .maybeSingle();
  if (reqErr) return jsonResponse({ error: reqErr.message }, 500);
  if (!request) return jsonResponse({ error: "large-refund request not found" }, 404);
  if (request.status !== "pending") return jsonResponse({ error: `already ${request.status}` }, 400);
  if (request.requested_by === userRes.user.id) {
    return jsonResponse({ error: "the admin who requested this cannot also approve it" }, 403);
  }

  if (decision === "declined") {
    const { data: updated, error: updateErr } = await admin
      .from("large_refund_approvals")
      .update({ status: "declined", approved_by: userRes.user.id, updated_at: new Date().toISOString() })
      .eq("id", request.id)
      .eq("status", "pending")
      .select("ref, status")
      .maybeSingle();
    if (updateErr) return jsonResponse({ error: updateErr.message }, 500);
    if (!updated) return jsonResponse({ error: "already decided by someone else" }, 409);
    return jsonResponse(updated);
  }

  const order = request.orders as unknown as { ref: string; provider_ref: string | null; status: string; total_cents: number } | null;
  if (!order) return jsonResponse({ error: "order not found" }, 500);
  if (order.status !== "paid") return jsonResponse({ error: `cannot refund an order that is ${order.status}` }, 400);
  if (!order.provider_ref) return jsonResponse({ error: "order has no payment reference to refund" }, 400);

  // Claim the request atomically before touching Paystack — a concurrent
  // second approval attempt must not fire two refunds.
  const { data: claimed, error: claimErr } = await admin
    .from("large_refund_approvals")
    .update({ status: "approved", approved_by: userRes.user.id, updated_at: new Date().toISOString() })
    .eq("id", request.id)
    .eq("status", "pending")
    .select("ref")
    .maybeSingle();
  if (claimErr) return jsonResponse({ error: claimErr.message }, 500);
  if (!claimed) return jsonResponse({ error: "already decided by someone else" }, 409);

  let paystackResult: { status: string; refundId: number };
  try {
    paystackResult = await refundTransaction(order.provider_ref, request.amount_cents);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await admin.from("refunds").insert({ order_id: request.order_id, amount_cents: request.amount_cents, reason: request.reason, status: "failed", actor_id: userRes.user.id });
    return jsonResponse({ error: message }, 502);
  }

  const { data: refund, error: refundErr } = await admin
    .from("refunds")
    .insert({ order_id: request.order_id, amount_cents: request.amount_cents, reason: request.reason, status: "processed", paystack_refund_id: String(paystackResult.refundId), actor_id: userRes.user.id })
    .select("ref")
    .single();
  if (refundErr) return jsonResponse({ error: refundErr.message }, 500);

  await admin.from("orders").update({ status: "refunded" }).eq("id", request.order_id);

  return jsonResponse({ ref: claimed.ref, status: "approved", refund_ref: refund.ref, order_ref: order.ref });
});
