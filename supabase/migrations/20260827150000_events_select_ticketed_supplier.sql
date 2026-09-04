-- Phase 3 (supplier date-collision awareness) needs a supplier to be able to
-- read event_date on events they have a real supplier_tickets relationship
-- with — events' existing RLS only allows the owning client or admin/super,
-- so a supplier's own join against events would silently come back empty.
-- Scoped tightly: only events actually tied to one of their own tickets,
-- mirroring ticket_messages_select_supplier's own scoping.
create policy events_select_ticketed_supplier on public.events for select to authenticated
  using (
    id in (
      select st.event_id from public.supplier_tickets st
      join public.suppliers s on s.id = st.supplier_id
      where s.profile_id = auth.uid()
    )
  );
