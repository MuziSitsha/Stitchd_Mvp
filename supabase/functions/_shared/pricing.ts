// Shared by baskets-price (preview) and orders-create (the real charge) so
// the two can never disagree — orders-create never trusts a client-supplied
// total, it recomputes from supplier_id/qty every time. Formula ported
// exactly from apps/web's StitchIt.tsx `cart` useMemo (SUB.pct = 0.12,
// SUB.delivery = R450 = 45000 cents), just in integer cents instead of Rands.
import { adminClient } from "./clients.ts";

const MEMBER_PCT = 0.12;
const DELIVERY_CENTS = 45000;

export interface BasketItemInput {
  supplier_id: string;
  qty: number;
  addon_cents?: number;
}

export interface PricedItem {
  supplier_id: string;
  name: string;
  qty: number;
  unit_price_cents: number;
  addon_cents: number;
  line_total_cents: number;
}

export interface PricedBasket {
  items: PricedItem[];
  subtotal_cents: number;
  bundle_saving_cents: number;
  member_saving_cents: number;
  delivery_cents: number;
  total_cents: number;
}

export async function priceBasket(items: BasketItemInput[], subscriber: boolean): Promise<PricedBasket> {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("items[] required");
  }

  const admin = adminClient();
  const ids = [...new Set(items.map((i) => i.supplier_id))];
  const { data: suppliers, error } = await admin
    .from("suppliers")
    .select("id, name, price_from_cents")
    .in("id", ids);
  if (error) throw new Error(error.message);

  const priced: PricedItem[] = items.map((i) => {
    const s = suppliers?.find((x) => x.id === i.supplier_id);
    if (!s) throw new Error(`supplier ${i.supplier_id} not found`);
    const unit = s.price_from_cents ?? 0;
    const qty = Math.max(1, Math.round(i.qty));
    const addon = Math.max(0, Math.round(i.addon_cents ?? 0));
    return {
      supplier_id: i.supplier_id,
      name: s.name,
      qty,
      unit_price_cents: unit,
      addon_cents: addon,
      line_total_cents: unit * qty + addon,
    };
  });

  const subtotal_cents = priced.reduce((a, p) => a + p.line_total_cents, 0);
  const n = priced.length;
  const bundlePct = n >= 4 ? 0.08 : n >= 3 ? 0.04 : 0;
  const bundle_saving_cents = Math.round(subtotal_cents * bundlePct);
  const afterBundle = subtotal_cents - bundle_saving_cents;
  const member_saving_cents = subscriber ? Math.round(afterBundle * MEMBER_PCT) : 0;
  const delivery_cents = n === 0 ? 0 : subscriber ? 0 : DELIVERY_CENTS;
  const total_cents = afterBundle - member_saving_cents + delivery_cents;

  return { items: priced, subtotal_cents, bundle_saving_cents, member_saving_cents, delivery_cents, total_cents };
}
