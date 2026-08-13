-- FR-SUP-05 (STITCHD-SRS-SDS.md): "Supplier views earnings, orders, rating,
-- repeat rate, payouts." orders/order_items were admin-only-select (they're
-- written by service-role Edge Functions) — a supplier had no way to see
-- their own bookings or whether the customer actually paid, even though
-- that same paid order is what spawned their lead in the first place.
--
-- A supplier can see an order only via the order_items that are theirs —
-- never another supplier's line items on a shared order.
create policy order_items_select_own_supplier on public.order_items for select to authenticated
  using (supplier_id in (select id from public.suppliers where profile_id = auth.uid()));

create policy orders_select_own_supplier on public.orders for select to authenticated
  using (
    id in (
      select oi.order_id from public.order_items oi
      join public.suppliers s on s.id = oi.supplier_id
      where s.profile_id = auth.uid()
    )
  );
