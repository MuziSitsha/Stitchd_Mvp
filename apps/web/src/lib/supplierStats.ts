// Shared real-data stats math for a supplier's dashboard — used by both the
// real self-service /supplier route (SupplierPortal.tsx) and the internal
// ops/admin/super Supplier Portal lens (SupplierPortalLens.tsx), so the two
// can never drift into showing different numbers for the same supplier.

export interface OrderInfo {
  id: string;
  ref: string;
  status: string;
  customer_name: string;
  customer_phone: string;
  occasion: string | null;
  hire_date: string | null;
  created_at: string;
  member_saving_cents: number;
}

export interface OrderItemRow {
  id: string;
  label: string;
  qty: number;
  line_total_cents: number;
  orders: OrderInfo;
}

export interface SupplierStats {
  earnings30d: number;
  ordersCount: number;
  repeatPct: number;
  memberSharePct: number;
  lifetimeEarnedCents: number;
}

export function computeSupplierStats(orderItems: OrderItemRow[]): SupplierStats {
  const paid = orderItems.filter((oi) => oi.orders.status === "paid");
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const earnings30d = paid
    .filter((oi) => new Date(oi.orders.created_at).getTime() >= thirtyDaysAgo)
    .reduce((sum, oi) => sum + oi.line_total_cents, 0);
  const lifetimeEarnedCents = paid.reduce((sum, oi) => sum + oi.line_total_cents, 0);

  const byOrder = new Map<string, { total: number; memberSaving: number; phone: string }>();
  for (const oi of paid) {
    const existing = byOrder.get(oi.orders.id) ?? { total: 0, memberSaving: oi.orders.member_saving_cents, phone: oi.orders.customer_phone };
    existing.total += oi.line_total_cents;
    byOrder.set(oi.orders.id, existing);
  }

  const byCustomer = new Map<string, number>();
  for (const o of byOrder.values()) byCustomer.set(o.phone, (byCustomer.get(o.phone) ?? 0) + 1);
  const repeatCustomers = [...byCustomer.values()].filter((n) => n > 1).length;
  const repeatPct = byCustomer.size > 0 ? Math.round((repeatCustomers / byCustomer.size) * 100) : 0;

  const memberOrders = [...byOrder.values()].filter((o) => o.memberSaving > 0).length;
  const memberSharePct = byOrder.size > 0 ? Math.round((memberOrders / byOrder.size) * 100) : 0;

  return { earnings30d, ordersCount: byOrder.size, repeatPct, memberSharePct, lifetimeEarnedCents };
}

export function groupOrderItems(orderItems: OrderItemRow[]): { order: OrderInfo; items: OrderItemRow[] }[] {
  const map = new Map<string, { order: OrderInfo; items: OrderItemRow[] }>();
  for (const oi of orderItems) {
    const g = map.get(oi.orders.id) ?? { order: oi.orders, items: [] };
    g.items.push(oi);
    map.set(oi.orders.id, g);
  }
  return [...map.values()].sort((a, b) => new Date(b.order.created_at).getTime() - new Date(a.order.created_at).getTime());
}
