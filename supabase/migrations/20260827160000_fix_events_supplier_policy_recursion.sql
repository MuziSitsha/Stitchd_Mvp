-- Fixes a real bug in the previous migration: events_select_ticketed_supplier
-- queried supplier_tickets directly inside its USING clause, but
-- supplier_tickets_select_client's own policy queries events right back —
-- the exact "classic Postgres RLS self-reference footgun" already called out
-- in 20260809120100_identity_and_ticket_spine.sql's own has_role() comment,
-- which this migration missed applying to itself. Fixed the same way: a
-- security definer helper so the inner lookup runs with RLS bypassed instead
-- of re-triggering supplier_tickets' policies (and by extension, events').
create function public.supplier_owns_ticket_for_event(p_event_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.supplier_tickets st
    join public.suppliers s on s.id = st.supplier_id
    where st.event_id = p_event_id and s.profile_id = p_user_id
  );
$$;

drop policy events_select_ticketed_supplier on public.events;

create policy events_select_ticketed_supplier on public.events for select to authenticated
  using (public.supplier_owns_ticket_for_event(id, auth.uid()));
