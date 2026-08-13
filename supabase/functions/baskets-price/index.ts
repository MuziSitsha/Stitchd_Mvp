// POST /functions/v1/baskets-price
// { items: [{ supplier_id, qty, addon_cents? }], subscriber?: boolean }
// STITCHD-SRS-SDS.md FR-MKT-03 / §13.3 "POST /api/v1/baskets/:id/price" —
// pure, idempotent, no writes, no auth. A live quote preview only; the
// actual charge in orders-create recomputes this itself rather than
// trusting whatever the client last saw.
import { jsonResponse } from "../_shared/clients.ts";
import { priceBasket } from "../_shared/pricing.ts";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "POST only" }, 405);
  }

  const body = await req.json().catch(() => ({}));
  const { items, subscriber } = body ?? {};

  try {
    const priced = await priceBasket(items, !!subscriber);
    return jsonResponse(priced);
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : String(e) }, 400);
  }
});
