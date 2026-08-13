// POST /functions/v1/orders-create
// { items, subscriber?, occasion?, hire_date?, customer_name, customer_phone, customer_email? }
// STITCHD-SRS-SDS.md FR-BOOK-01 / §13.3 "POST /api/v1/orders" — checkout
// converts a basket into an order (ST-BKG, Draft->Quoted). Public, like
// leads-create: the customer isn't a Supabase Auth user in this flow.
// Money is always recomputed here from supplier_id/qty via the same
// pricing module baskets-price uses for its preview — never trusted from
// the client, so a tampered total in the request body has no effect.
import { adminClient, jsonResponse } from "../_shared/clients.ts";
import { priceBasket } from "../_shared/pricing.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const { items, subscriber, occasion, hire_date, customer_name, customer_phone, customer_email } = body ?? {};

  if (!customer_name || !customer_phone) {
    return jsonResponse({ error: "customer_name and customer_phone are required" }, 400);
  }

  let priced;
  try {
    priced = await priceBasket(items, !!subscriber);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 400);
  }

  const admin = adminClient();

  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      occasion,
      hire_date,
      customer_name,
      customer_phone,
      customer_email,
      subtotal_cents: priced.subtotal_cents,
      bundle_saving_cents: priced.bundle_saving_cents,
      member_saving_cents: priced.member_saving_cents,
      delivery_cents: priced.delivery_cents,
      total_cents: priced.total_cents,
      status: "draft",
    })
    .select("id, ref, total_cents")
    .single();
  if (orderErr) return jsonResponse({ error: orderErr.message }, 500);

  const { error: itemsErr } = await admin.from("order_items").insert(
    priced.items.map((it) => ({
      order_id: order.id,
      supplier_id: it.supplier_id,
      label: it.name,
      qty: it.qty,
      unit_price_cents: it.unit_price_cents,
      addon_cents: it.addon_cents,
      line_total_cents: it.line_total_cents,
    })),
  );
  if (itemsErr) return jsonResponse({ error: itemsErr.message }, 500);

  return jsonResponse({ ref: order.ref, total_cents: order.total_cents }, 201);
});
