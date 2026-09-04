-- Phase C — a general operational ticket system (the doc's actual ask:
-- supplier delays, payment issues, guest problems, disputes, platform
-- support), separate from supplier_tickets (which stays exactly as-is — the
-- client's Squad/Suppliers lens reads its narrow pending/confirmed/declined
-- status via name-matching in useLiveSupplierTickets.ts, and touching that
-- risks the client experience that isn't being changed).
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default next_ref('TIX'),
  event_id uuid references public.events (id) on delete set null,
  supplier_id uuid references public.suppliers (id) on delete set null,
  linked_resource_type text check (linked_resource_type in ('booking', 'quote', 'payment', 'task', 'lead')),
  linked_resource_id uuid,
  category text not null check (category in ('supplier_delay', 'payment', 'venue', 'guest', 'task', 'platform_support', 'dispute', 'other')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'assigned', 'accepted', 'in_progress', 'waiting_client', 'waiting_supplier', 'resolved', 'closed', 'reopened')),
  visibility text not null default 'internal' check (visibility in ('client', 'supplier', 'internal')),
  created_by uuid not null references auth.users (id),
  created_by_role text not null check (created_by_role in ('client', 'supplier', 'admin')),
  owner_id uuid references auth.users (id),
  response_due_at timestamptz,
  resolution_due_at timestamptz,
  resolution_summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tickets_supplier_idx on public.tickets (supplier_id);
create index tickets_status_idx on public.tickets (status);

create trigger tickets_audit after insert or update on public.tickets
  for each row execute function public.log_activity();

-- Full transition history per the doc ("every transition stores actor,
-- timestamp, reason/comment") — written by the tickets-transition Edge
-- Function, not directly by clients.
create table public.ticket_transitions (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  from_status text,
  to_status text not null,
  actor_id uuid references auth.users (id),
  actor_role text,
  reason text,
  created_at timestamptz not null default now()
);
create index ticket_transitions_ticket_idx on public.ticket_transitions (ticket_id, created_at);

-- Comments — N-party (client/supplier/admin), unlike ticket_messages' fixed
-- two-party shape, since a ticket's visibility can include any of the three.
create table public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  author_id uuid not null references auth.users (id),
  author_role text not null check (author_role in ('client', 'supplier', 'admin')),
  body text not null,
  created_at timestamptz not null default now()
);
create index ticket_comments_ticket_idx on public.ticket_comments (ticket_id, created_at);

alter table public.tickets enable row level security;
alter table public.ticket_transitions enable row level security;
alter table public.ticket_comments enable row level security;

-- Visibility-gated select: admin/super always see everything; a supplier
-- sees their own tickets when visibility allows it; a client sees their own
-- event's tickets when visibility allows it. Creator can always see their
-- own ticket regardless of visibility (so a supplier who raised an
-- 'internal' ticket can still track it).
create policy tickets_select on public.tickets for select to authenticated
  using (
    public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
    or created_by = auth.uid()
    or (visibility = 'supplier' and supplier_id in (select id from public.suppliers where profile_id = auth.uid()))
    or (visibility = 'client' and event_id in (select id from public.events where owner_id = auth.uid()))
  );

-- Insert: a supplier can raise a ticket about themselves; admin can raise
-- any. (Client-side ticket creation is out of scope for this pass — no
-- client UI exists to do it, matching "focus on supplier and admin".)
create policy tickets_insert on public.tickets for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      (created_by_role = 'supplier' and supplier_id in (select id from public.suppliers where profile_id = auth.uid()))
      or (created_by_role = 'admin' and public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]))
    )
  );

-- Comments follow the parent ticket's own select visibility exactly —
-- same idiom as ticket_messages mirroring supplier_tickets' own policies.
create policy ticket_comments_select on public.ticket_comments for select to authenticated
  using (ticket_id in (select id from public.tickets));

create policy ticket_comments_insert on public.ticket_comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and ticket_id in (select id from public.tickets)
  );

create policy ticket_transitions_select on public.ticket_transitions for select to authenticated
  using (ticket_id in (select id from public.tickets));

alter publication supabase_realtime add table public.tickets;
alter publication supabase_realtime add table public.ticket_comments;
alter publication supabase_realtime add table public.ticket_transitions;
