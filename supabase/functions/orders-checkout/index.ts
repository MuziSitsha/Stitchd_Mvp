// POST /functions/v1/orders-checkout  { ref }
// STITCHD-SRS-SDS.md §13.3 "POST /api/v1/orders/:ref/checkout" — same shape
// as boosts-checkout (init a real Paystack transaction, store the provider
// ref, let the webhook be the only source of truth for payment success).
// Public, matching orders-create — no Supabase session in this flow.
// NOTE: like Boost, the actual Paystack call fails until PAYSTACK_SECRET_KEY
// is configured (deferred to go-live by design, not a bug in this function).
import { adminClient, jsonResponse } from "../_shared/clients.ts";
import { initializeTransaction } from "../_shared/paystack.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const { ref } = body ?? {};
  if (!ref) return jsonResponse({ error: "ref is required" }, 400);

  const admin = adminClient();
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .select("id, ref, total_cents, customer_email, status")
    .eq("ref", ref)
    .maybeSingle();
  if (orderErr) return jsonResponse({ error: orderErr.message }, 500);
  if (!order) return jsonResponse({ error: "order not found" }, 404);
  if (order.status !== "draft") return jsonResponse({ error: `order is already ${order.status}` }, 409);

  try {
    const checkout = await initializeTransaction({
      email: order.customer_email ?? `${order.id}@stitchd.sandbox`,
      amountCents: order.total_cents,
      reference: order.ref,
      metadata: { order_id: order.id },
    });

    await admin.from("orders").update({ status: "pending_payment", provider_ref: checkout.reference }).eq("id", order.id);

    return jsonResponse({ ref: order.ref, checkout_url: checkout.authorizationUrl });
  } catch (e) {
    await admin.from("orders").update({ status: "failed" }).eq("id", order.id);
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 502);
  }
});
