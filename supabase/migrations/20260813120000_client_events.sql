-- The real, minimal seed of a per-account client wedding. Onboarding
-- (apps/web/src/state/ProtoState.tsx's finishOnboarding) inserts one row
-- here per client account — its existence is what "has this person already
-- onboarded" means going forward, so the wizard never re-fires on reload.
-- Guests/budget-lines/tasks/etc still read the shared demo seed data
-- (data.ts) for now; migrating those to live per-event tables is a separate,
-- larger follow-on project.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'Wedding',
  guest_count int not null default 0,
  budget_cap_cents bigint,
  palette_index int not null default 0,
  priorities text[] not null default '{}',
  support_level text,
  comm_channel text,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

-- One event per client account for now (Phase 1 scope) — also doubles as
-- the "has this account onboarded" check via a plain existence query.
create unique index events_one_per_owner on public.events(owner_id);

create policy events_select_own on public.events for select
  using (owner_id = auth.uid() or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

create policy events_insert_own on public.events for insert
  with check (owner_id = auth.uid());

create policy events_update_own on public.events for update
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
