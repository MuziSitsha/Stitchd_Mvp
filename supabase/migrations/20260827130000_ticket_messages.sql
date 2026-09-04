-- Real supplier<->client messaging on supplier_tickets (wedding-squad side —
-- both parties always have a real logged-in account here, unlike Stitch It's
-- often-anonymous leads, which get their own token-based table separately).
-- Unlike supplier_tickets itself (service-role-only state transitions), this
-- is plain two-party chat — same "manage your own row" tier as
-- supplier_addons/supplier_categories, direct client reads/writes, no Edge
-- Function needed.
create table public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.supplier_tickets (id) on delete cascade,
  sender_id uuid not null references auth.users (id),
  sender_role text not null check (sender_role in ('client', 'supplier')),
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index ticket_messages_ticket_idx on public.ticket_messages (ticket_id, created_at);

alter table public.ticket_messages enable row level security;

-- Select mirrors supplier_tickets' own three-way split exactly.
create policy ticket_messages_select_client on public.ticket_messages for select to authenticated
  using (
    ticket_id in (
      select st.id from public.supplier_tickets st
      join public.events e on e.id = st.event_id
      where e.owner_id = auth.uid()
    )
  );

create policy ticket_messages_select_supplier on public.ticket_messages for select to authenticated
  using (
    ticket_id in (
      select st.id from public.supplier_tickets st
      join public.suppliers s on s.id = st.supplier_id
      where s.profile_id = auth.uid()
    )
  );

create policy ticket_messages_select_admin on public.ticket_messages for select to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

-- Insert: you can only speak as the side you actually are, on a ticket you
-- actually have a stake in — a client can't post as "supplier" or into
-- someone else's ticket, and vice versa.
create policy ticket_messages_insert_client on public.ticket_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and sender_role = 'client'
    and ticket_id in (
      select st.id from public.supplier_tickets st
      join public.events e on e.id = st.event_id
      where e.owner_id = auth.uid()
    )
  );

create policy ticket_messages_insert_supplier on public.ticket_messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and sender_role = 'supplier'
    and ticket_id in (
      select st.id from public.supplier_tickets st
      join public.suppliers s on s.id = st.supplier_id
      where s.profile_id = auth.uid()
    )
  );

alter publication supabase_realtime add table public.ticket_messages;
