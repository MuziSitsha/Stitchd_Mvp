-- Backs the new in-app "Supplier Portal" lens (stitchd-v9.jsx lines
-- 2302-2448, ported as an ops/admin/super-facing internal view — see
-- STITCHD-SRS-SDS.md §B4.4 "role switch: Supplier, Ops, Operator" and §5.5's
-- permission matrix). Widens existing RLS so a privileged internal user can
-- preview and act on behalf of any supplier; a real external supplier's own
-- access via /supplier/* is untouched (those policies already covered their
-- own row and aren't modified here).

-- Operator previewing-as-supplier needs to Accept/Decline through the
-- existing leads-respond function unchanged — that function runs on the
-- caller's own JWT and relies entirely on this policy for enforcement.
drop policy leads_update_own_supplier on public.leads;
create policy leads_update_own_supplier on public.leads for update to authenticated
  using (
    supplier_id in (select id from public.suppliers where profile_id = auth.uid())
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  )
  with check (
    supplier_id in (select id from public.suppliers where profile_id = auth.uid())
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );

-- Ops needs to read the live cross-supplier lead board and Pipeline GMV
-- (STITCHD-SRS-SDS.md §5.5: Ops gets "reroute", which requires seeing every
-- lead first — read access is a prerequisite, not the same as write access).
drop policy leads_select_own_supplier on public.leads;
create policy leads_select_own_supplier on public.leads for select to authenticated
  using (
    supplier_id in (select id from public.suppliers where profile_id = auth.uid())
    or public.has_role(auth.uid(), array['ops', 'admin', 'super']::public.app_role[])
  );

drop policy orders_select_admin on public.orders;
create policy orders_select_admin on public.orders for select to authenticated
  using (public.has_role(auth.uid(), array['ops', 'admin', 'super']::public.app_role[]));

drop policy order_items_select_admin on public.order_items;
create policy order_items_select_admin on public.order_items for select to authenticated
  using (public.has_role(auth.uid(), array['ops', 'admin', 'super']::public.app_role[]));

-- Previewing-as-supplier needs to manage package add-ons on a supplier's
-- behalf (§A2.3: "Operator/Admin: manages catalogue"). Deliberately
-- admin/super only, not ops — matches ops's persona ("keep leads flowing"),
-- not catalogue management.
drop policy supplier_addons_manage_own on public.supplier_addons;
create policy supplier_addons_manage_own on public.supplier_addons for all to authenticated
  using (
    supplier_id in (select id from public.suppliers where profile_id = auth.uid())
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  )
  with check (
    supplier_id in (select id from public.suppliers where profile_id = auth.uid())
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );
