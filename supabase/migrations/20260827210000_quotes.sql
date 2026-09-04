-- Phase E — versioned quotes attached to supplier_tickets (the real,
-- already-selected client-event relationship with real budget/guest-count
-- data — matches the doc's own lead-card example far better than the
-- anonymous Stitch-It `leads` table). RLS mirrors supplier_tickets' own
-- three-way select split exactly, same idiom already proven for
-- ticket_messages — no recursion risk since nothing reads back onto
-- supplier_tickets/events from here.
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default next_ref('QUO'),
  ticket_id uuid not null references public.supplier_tickets (id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'sent', 'change_requested', 'accepted', 'declined', 'expired')),
  current_version int not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index quotes_one_per_ticket on public.quotes (ticket_id);

-- Immutable once created — "accepted quote version is the source of
-- booking line items" (the doc's own integrity rule). A revision after a
-- change request is a new row, never an edit to an old one.
create table public.quote_versions (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  version int not null,
  total_cents int not null,
  note text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  unique (quote_id, version)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_version_id uuid not null references public.quote_versions (id) on delete cascade,
  label text not null,
  qty int not null default 1,
  unit_price_cents int not null,
  line_total_cents int not null
);
create index quote_items_version_idx on public.quote_items (quote_version_id);

create trigger quotes_audit after insert or update on public.quotes
  for each row execute function public.log_activity();

alter table public.quotes enable row level security;
alter table public.quote_versions enable row level security;
alter table public.quote_items enable row level security;

create policy quotes_select_client on public.quotes for select to authenticated
  using (
    ticket_id in (
      select st.id from public.supplier_tickets st
      join public.events e on e.id = st.event_id
      where e.owner_id = auth.uid()
    )
  );
create policy quotes_select_supplier on public.quotes for select to authenticated
  using (
    ticket_id in (
      select st.id from public.supplier_tickets st
      join public.suppliers s on s.id = st.supplier_id
      where s.profile_id = auth.uid()
    )
  );
create policy quotes_select_admin on public.quotes for select to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

-- quote_versions/quote_items just follow their parent quote's own select
-- visibility — same "look through the parent" idiom used elsewhere.
create policy quote_versions_select on public.quote_versions for select to authenticated
  using (quote_id in (select id from public.quotes));
create policy quote_items_select on public.quote_items for select to authenticated
  using (quote_version_id in (select id from public.quote_versions));

alter publication supabase_realtime add table public.quotes;
alter publication supabase_realtime add table public.quote_versions;
alter publication supabase_realtime add table public.quote_items;
