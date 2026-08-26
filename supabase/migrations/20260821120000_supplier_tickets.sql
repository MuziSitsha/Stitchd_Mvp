-- Supplier confirmation tickets: the client requests confirmation on a
-- supplier from Squad/Suppliers (orange, "pending"), and either the real
-- claimed supplier (/supplier) or a real admin (/admin) confirms it (green,
-- "confirmed") — reflected live on the client's grid via Realtime, matching
-- the existing useLiveSupplierStatus.ts name-matching + refetch pattern.
--
-- Same tier as leads/boosts/verifications/orders: creation and confirmation
-- are side-effecting writes and go through service-role-backed Edge
-- Functions (supplier-tickets-create / supplier-tickets-confirm), which
-- bypass RLS entirely — no insert/update policy for any role, select-only.
--
-- Reuses the existing "ticket spine" from 20260809120100_identity_and_ticket_
-- spine.sql: next_ref('SUP') for a human-readable ref (compatible with
-- tickets-trace, which requires an "ST-" prefix) and the generic
-- log_activity() trigger for a free audit trail in activity_log — no need
-- for a bespoke history table, the row's own created_at/confirmed_at/
-- confirmed_by/confirmed_role columns are enough for the 2-step timeline UI.
create table public.supplier_tickets (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.next_ref('SUP'),
  event_id uuid not null references public.events (id) on delete cascade,
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'confirmed')),
  requested_by uuid not null references auth.users (id),
  confirmed_by uuid references auth.users (id),
  confirmed_role text check (confirmed_role in ('supplier', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index supplier_tickets_event_idx on public.supplier_tickets (event_id);
create index supplier_tickets_supplier_idx on public.supplier_tickets (supplier_id);

-- Atomic guard against the double-click/two-tabs race (the create function
-- also does select-existing-pending-first, but this is the real guarantee).
create unique index supplier_tickets_one_pending
  on public.supplier_tickets (event_id, supplier_id)
  where status = 'pending';

create trigger supplier_tickets_audit after insert or update on public.supplier_tickets
  for each row execute function public.log_activity();

alter table public.supplier_tickets enable row level security;

-- Client sees tickets on their own event.
create policy supplier_tickets_select_client on public.supplier_tickets for select to authenticated
  using (event_id in (select id from public.events where owner_id = auth.uid()));

-- Claimed supplier sees tickets addressed to their own listing.
create policy supplier_tickets_select_supplier on public.supplier_tickets for select to authenticated
  using (supplier_id in (select id from public.suppliers where profile_id = auth.uid()));

-- Admin/super sees everything (cross-account console view).
create policy supplier_tickets_select_admin on public.supplier_tickets for select to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

alter publication supabase_realtime add table public.supplier_tickets;
