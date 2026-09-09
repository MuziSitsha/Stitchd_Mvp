-- WBS-02 (Part J1 gaps: functions, bookings, explicit membership).
-- Additive only, per Part M3's own cutover rule ("expand -> migrate and
-- backfill -> deploy compatible code -> verify -> retire old columns
-- later"): events.owner_id stays exactly as it is and every existing
-- policy that reads it keeps working untouched. This adds the data model
-- Part B2's invariants (Owner/Partner/Event Lead, delegation, atomic
-- transfer) and RSVP (Part F) actually need on top of it.

-- ---------------------------------------------------------------------------
-- functions: an event's ceremony/reception/traditional-celebration
-- occasions. "Use one programme with per-function timing, venue and guest
-- entitlement. Do not create duplicate weddings."
create table public.functions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  timezone text not null default 'Africa/Johannesburg',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index functions_event_idx on public.functions (event_id);
alter table public.functions enable row level security;

create policy functions_select on public.functions for select to authenticated
  using (
    event_id in (select id from public.events where owner_id = auth.uid())
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );
create policy functions_insert on public.functions for insert to authenticated
  with check (event_id in (select id from public.events where owner_id = auth.uid()));
create policy functions_update on public.functions for update to authenticated
  using (event_id in (select id from public.events where owner_id = auth.uid()))
  with check (event_id in (select id from public.events where owner_id = auth.uid()));

alter publication supabase_realtime add table public.functions;

-- Every existing single-occasion event gets one function representing its
-- main occasion, so nothing built on top of `events` breaks.
insert into public.functions (event_id, name, starts_at, timezone)
select id, coalesce(nullif(type, ''), 'Wedding'),
  case when event_date is not null then event_date::timestamptz else null end,
  'Africa/Johannesburg'
from public.events;

-- ---------------------------------------------------------------------------
-- bookings: "exactly one booking per accepted quote version" — currently
-- implied by quotes.status = 'accepted' + supplier_tickets.status =
-- 'confirmed' with no row of its own. quote_version_id, not quote_id: an
-- accepted booking is pinned to the specific frozen version that was agreed.
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.next_ref('BKG'),
  quote_version_id uuid not null references public.quote_versions (id) on delete cascade,
  state text not null default 'pending_confirmation'
    check (state in ('pending_confirmation', 'confirmed', 'in_delivery', 'completed', 'cancellation_requested', 'cancelled')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index bookings_one_per_quote_version on public.bookings (quote_version_id);
alter table public.bookings enable row level security;

-- Same "look through the parent" idiom as quote_versions_select — proven by
-- this session's own RLS test suite to correctly inherit quotes' own
-- client/supplier/admin visibility via the inner subquery's RLS, not an
-- open read. No insert/update policy for `authenticated`: like
-- budget_payments and quotes, every real row is written by an Edge Function
-- (quotes-respond) using the service role, never directly from the browser.
create policy bookings_select on public.bookings for select to authenticated
  using (quote_version_id in (select id from public.quote_versions));

alter publication supabase_realtime add table public.bookings;

-- Backfill: one booking per already-accepted quote, state derived from the
-- ticket's existing confirmation, so history isn't silently missing.
insert into public.bookings (quote_version_id, state, confirmed_at)
select qv.id,
  case when st.status = 'confirmed' then 'confirmed' else 'pending_confirmation' end,
  st.confirmed_at
from public.quotes q
join public.quote_versions qv on qv.quote_id = q.id and qv.version = q.current_version
join public.supplier_tickets st on st.id = q.ticket_id
where q.status = 'accepted'
on conflict (quote_version_id) do nothing;

-- ---------------------------------------------------------------------------
-- event_members: Part B2's actual ask. events.owner_id remains the
-- authoritative single Owner pointer (every existing policy keeps reading
-- it); this table is the explicit record of who else has standing on an
-- event and on what terms, plus the audit trail an owner transfer needs.
create table public.event_members (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'partner', 'event_lead')),
  status text not null default 'active' check (status in ('active', 'revoked')),
  granted_by uuid references auth.users (id),
  spend_ceiling_cents bigint check (spend_ceiling_cents is null or spend_ceiling_cents >= 0),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index event_members_event_idx on public.event_members (event_id);
-- "Each active event has exactly one active Owner and at most one active
-- Event Lead" — enforced here, not just assumed by application code.
create unique index event_members_one_active_owner on public.event_members (event_id)
  where role = 'owner' and status = 'active';
create unique index event_members_one_active_lead on public.event_members (event_id)
  where role = 'event_lead' and status = 'active';
alter table public.event_members enable row level security;

-- Read-your-own-membership + admin only. Writes go through
-- transfer_event_ownership below (ownership) or a future delegation RPC
-- (partner/lead) — never direct REST, matching the money-adjacent tables'
-- established pattern in this project.
create policy event_members_select on public.event_members for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

insert into public.event_members (event_id, user_id, role, status, granted_by)
select id, owner_id, 'owner', 'active', owner_id from public.events;

-- The backfill above only covers events that already existed at migration
-- time — found by writing this migration's own test, not by inspection:
-- nothing seeded event_members for an event created afterward, silently
-- leaving every new event's Owner unrecorded. security definer because the
-- inserting caller (an ordinary client, via events_insert_own) has no
-- insert policy of their own on event_members — this is a narrow, fixed,
-- system-managed write, not something the trigger hands the caller control
-- over.
create function public.events_seed_owner_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.event_members (event_id, user_id, role, status, granted_by)
  values (new.id, new.owner_id, 'owner', 'active', new.owner_id);
  return new;
end;
$$;

create trigger events_seed_owner_membership
  after insert on public.events
  for each row execute function public.events_seed_owner_membership();

-- ---------------------------------------------------------------------------
-- Atomic owner transfer (Part B2: "the outgoing Owner proposes, the
-- incoming Owner accepts, and the backend swaps authority in one
-- transaction"). This function is the swap step; the propose/accept
-- handshake belongs in a future Edge Function on top of it — deliberately
-- out of WBS-02's scope here, this is the invariant-preserving primitive
-- everything above it will call.
--
-- security definer, deliberately unlike suppliers_guard_privileged_columns:
-- the internal `update events` needs to set owner_id to someone other than
-- the caller, which events_update_own's own WITH CHECK (owner_id =
-- auth.uid()) correctly refuses for an ordinary authenticated caller — RLS
-- doing exactly its job against code that hadn't earned the right to
-- bypass it yet. Authorization is enforced explicitly below instead.
-- session_user, not current_user, for the service-role check specifically
-- because session_user stays correct under security definer (current_user
-- would reflect the function's owner instead of the real caller).
create function public.transfer_event_ownership(p_event_id uuid, p_new_owner_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_current_owner uuid;
  v_is_privileged boolean;
begin
  select owner_id into v_current_owner from public.events where id = p_event_id;
  if v_current_owner is null then
    raise exception 'event not found';
  end if;

  v_is_privileged := (session_user = 'service_role')
    or public.has_role(v_caller, array['admin', 'super']::public.app_role[]);

  if v_caller is distinct from v_current_owner and not v_is_privileged then
    raise exception 'only the current owner (or an admin) may transfer event ownership';
  end if;

  if p_new_owner_id is null then
    raise exception 'p_new_owner_id is required';
  end if;

  update public.events set owner_id = p_new_owner_id where id = p_event_id;

  update public.event_members
    set status = 'revoked'
    where event_id = p_event_id and role = 'owner' and status = 'active';

  insert into public.event_members (event_id, user_id, role, status, granted_by)
    values (p_event_id, p_new_owner_id, 'owner', 'active', coalesce(v_caller, v_current_owner));
end;
$$;

grant execute on function public.transfer_event_ownership(uuid, uuid) to authenticated;
