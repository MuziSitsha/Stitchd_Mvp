-- Phase D — supplier calendar/capacity. Only the supplier's manual
-- overrides live here ('blocked'/'promo') — 'open' is just the absence of a
-- row, and 'booked'/'tentative' are computed client-side from real
-- supplier_tickets/events.event_date data (Phase 3), not stored here, so
-- there's never a second source of truth to drift out of sync.
create table public.supplier_availability (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  date date not null,
  state text not null check (state in ('blocked', 'promo')),
  note text,
  created_at timestamptz not null default now(),
  unique (supplier_id, date)
);

alter table public.supplier_availability enable row level security;

create policy supplier_availability_select_all on public.supplier_availability for select
  using (true);

-- Same tier as supplier_addons/supplier_categories — plain CRUD on your own
-- row, no side effects, no Edge Function needed.
create policy supplier_availability_manage_own on public.supplier_availability for all to authenticated
  using (supplier_id in (select id from public.suppliers where profile_id = auth.uid()))
  with check (supplier_id in (select id from public.suppliers where profile_id = auth.uid()));

alter publication supabase_realtime add table public.supplier_availability;
