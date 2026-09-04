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

export interface WeeklyEarning {
  weekStart: string;
  label: string;
  totalCents: number;
}

// Same paid-order-items source computeSupplierStats already collapses into
// one 30-day number — bucketed by week instead, for the Phase 5 chart. Weeks
// run Monday-start; always returns `weeks` buckets (zero-filled) so a quiet
// week reads as a real dip rather than a missing bar.
export function computeWeeklyEarnings(orderItems: OrderItemRow[], weeks = 8): WeeklyEarning[] {
  const paid = orderItems.filter((oi) => oi.orders.status === "paid");

  function mondayOf(d: Date): Date {
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const m = new Date(d);
    m.setHours(0, 0, 0, 0);
    m.setDate(m.getDate() + diff);
    return m;
  }

  const thisWeekStart = mondayOf(new Date());
  const buckets: WeeklyEarning[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisWeekStart);
    start.setDate(start.getDate() - i * 7);
    buckets.push({
      weekStart: start.toISOString().slice(0, 10),
      label: start.toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
      totalCents: 0,
    });
  }

  const byWeekStart = new Map(buckets.map((b) => [b.weekStart, b]));
  for (const oi of paid) {
    const weekStart = mondayOf(new Date(oi.orders.created_at)).toISOString().slice(0, 10);
    const bucket = byWeekStart.get(weekStart);
    if (bucket) bucket.totalCents += oi.line_total_cents;
  }

  return buckets;
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
