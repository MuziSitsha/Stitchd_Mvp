-- WBS-03: RSVP data model (Part F — "the signature release", fully
-- greenfield per the gap register). Follows this codebase's own established
-- idiom for anonymous customer access (see lead-messages/leads-create:
-- verify_jwt = false, zero client-facing RLS, the Edge Function is the only
-- door in, service role does the real check) rather than inventing a
-- parallel mechanism — but honours Part F2's stricter, deliberate security
-- asks that idiom doesn't already meet: hash-only token storage (never the
-- raw token), a real session-exchange step, and version-based revocation.

-- ---------------------------------------------------------------------------
create table public.households (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index households_event_idx on public.households (event_id);
alter table public.households enable row level security;

-- Host-only. Guests never touch this table directly — see the RSVP Edge
-- Functions below, same "service role is the only door in" idiom as
-- lead_messages.
create policy households_select on public.households for select to authenticated
  using (
    event_id in (select id from public.events where owner_id = auth.uid())
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );
create policy households_insert on public.households for insert to authenticated
  with check (event_id in (select id from public.events where owner_id = auth.uid()));
create policy households_update on public.households for update to authenticated
  using (event_id in (select id from public.events where owner_id = auth.uid()))
  with check (event_id in (select id from public.events where owner_id = auth.uid()));

-- ---------------------------------------------------------------------------
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  display_name text not null,
  person_type text not null default 'adult' check (person_type in ('adult', 'child')),
  created_at timestamptz not null default now()
);
create index guests_household_idx on public.guests (household_id);
alter table public.guests enable row level security;

create policy guests_select on public.guests for select to authenticated
  using (
    household_id in (
      select h.id from public.households h join public.events e on e.id = h.event_id where e.owner_id = auth.uid()
    )
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );
create policy guests_insert on public.guests for insert to authenticated
  with check (
    household_id in (
      select h.id from public.households h join public.events e on e.id = h.event_id where e.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Entitlement: which Function a guest MAY attend (host-set, the invite
-- scope). Response: what they actually said (guest-set, via the Edge
-- Functions below). Deliberately two tables, matching Part F2's own
-- distinction rather than conflating "invited to" with "answered".
create table public.guest_entitlements (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests (id) on delete cascade,
  function_id uuid not null references public.functions (id) on delete cascade,
  plus_one_allowed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (guest_id, function_id)
);
alter table public.guest_entitlements enable row level security;

create policy guest_entitlements_select on public.guest_entitlements for select to authenticated
  using (
    guest_id in (
      select g.id from public.guests g
      join public.households h on h.id = g.household_id
      join public.events e on e.id = h.event_id
      where e.owner_id = auth.uid()
    )
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );
create policy guest_entitlements_insert on public.guest_entitlements for insert to authenticated
  with check (
    guest_id in (
      select g.id from public.guests g
      join public.households h on h.id = g.household_id
      join public.events e on e.id = h.event_id
      where e.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- "Not sure yet" saves a draft and is never a final answer" — state carries
-- that distinction explicitly rather than overloading `answer`. No
-- client-facing RLS at all: only rsvp-submit-response (guest, session-
-- validated) and the host read path below ever touch this table.
create table public.guest_responses (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests (id) on delete cascade,
  function_id uuid not null references public.functions (id) on delete cascade,
  state text not null default 'not_responded' check (state in ('not_responded', 'draft', 'submitted')),
  answer text check (answer in ('attending', 'declined')),
  meal text,
  dietary_note text,
  plus_one_name text,
  revision int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guest_id, function_id)
);
alter table public.guest_responses enable row level security;

-- Host read-only — the count the readiness/guest dashboards need. Writes
-- are exclusively rsvp-submit-response's service-role client.
create policy guest_responses_select on public.guest_responses for select to authenticated
  using (
    guest_id in (
      select g.id from public.guests g
      join public.households h on h.id = g.household_id
      join public.events e on e.id = h.event_id
      where e.owner_id = auth.uid()
    )
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );

alter publication supabase_realtime add table public.guest_responses;

-- ---------------------------------------------------------------------------
-- "Generate at least 256-bit random invitation tokens. Store only the hash
-- and expiry." One invitation per household (re-publishing bumps version
-- and mints a new token rather than creating a second row). No client-
-- facing RLS on this table at all — the raw token is never something even
-- the owning host's authenticated session reads back out; the Edge
-- Functions are the only door in, same as lead_messages.
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  token_hash text,
  token_version int not null default 0,
  state text not null default 'draft' check (state in ('draft', 'published', 'revoked', 'expired')),
  expires_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index invitations_one_per_household on public.invitations (household_id);
create index invitations_token_hash_idx on public.invitations (token_hash) where token_hash is not null;
alter table public.invitations enable row level security;

-- One new household -> one draft invitation, automatically. Matches the
-- WBS-02 lesson (events_seed_owner_membership): seed this at the source,
-- not somewhere a future insert path could forget it.
create function public.households_seed_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.invitations (household_id, state) values (new.id, 'draft');
  return new;
end;
$$;
create trigger households_seed_invitation
  after insert on public.households
  for each row execute function public.households_seed_invitation();

-- ---------------------------------------------------------------------------
-- The "scoped session" from token exchange. Deliberately not a browser
-- HttpOnly cookie — this SPA and its Edge Functions sit on different
-- origins (Vercel vs Supabase), and the rest of this app's own Supabase
-- Auth sessions already persist client-side (supabase-js's own localStorage
-- session) rather than via HttpOnly cookies, so this matches the existing
-- trust model instead of introducing a stricter-on-paper mechanism this
-- stack doesn't naturally support. Hash-only storage, same reasoning as
-- invitations.token_hash. invitation_version_at_mint plus a live re-check
-- against the current invitation row (not a cached claim) is what makes
-- "reissued tokens invalidate previous sessions" and revocation actually
-- take effect immediately, not just on next mint.
create table public.guest_sessions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  session_token_hash text not null,
  invitation_version_at_mint int not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index guest_sessions_token_hash_idx on public.guest_sessions (session_token_hash);
create index guest_sessions_household_idx on public.guest_sessions (household_id);
alter table public.guest_sessions enable row level security;
-- No client-facing policies at all — internal bookkeeping only.

-- ---------------------------------------------------------------------------
-- Idempotent CSV/manual import — "Import is idempotent by upload
-- fingerprint plus explicit row key." One row per submitted batch; a
-- retried identical submit is detected and returned as-is rather than
-- silently duplicating every household and guest in it.
create table public.guest_import_batches (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  fingerprint text not null,
  household_count int not null default 0,
  guest_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, fingerprint)
);
alter table public.guest_import_batches enable row level security;
create policy guest_import_batches_select on public.guest_import_batches for select to authenticated
  using (
    event_id in (select id from public.events where owner_id = auth.uid())
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );
