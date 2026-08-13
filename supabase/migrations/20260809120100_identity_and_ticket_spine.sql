-- Phase 1: Identity & Access + the ticket-traceability spine.
-- Maps STITCHD-SRS-SDS.md's abstract ORG/USER/ROLE_ASSIGNMENT/ACTIVITY_LOG
-- entities onto Supabase's actual primitives:
--   auth.users        = authentication identity (Supabase-managed)
--   public.profiles   = app-level identity, 1:1 with auth.users
--   public.orgs       = tenant/org
--   public.role_assignments = the spec's ROLE_ASSIGNMENT, RBAC source of truth
--   public.activity_log     = the spec's append-only audit spine (§7.5/§B7.5)

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('client', 'supplier', 'coach', 'ops', 'admin', 'super');

-- ---------------------------------------------------------------------------
-- Orgs
-- ---------------------------------------------------------------------------
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid references public.orgs (id),
  display_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row whenever Supabase Auth creates a user, so every
-- authenticated identity has an app-level profile without a client-side
-- insert policy being needed.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role assignments — the RBAC source of truth (permission matrix: STITCHD-SRS-SDS.md §B3.5)
-- ---------------------------------------------------------------------------
create table public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  org_id uuid references public.orgs (id),
  role public.app_role not null,
  status text not null default 'active' check (status in ('invited', 'active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, org_id, role)
);

-- security definer helper so RLS policies can check "does this user hold role X"
-- without recursing into role_assignments' own RLS (the classic Postgres RLS
-- self-reference footgun).
create function public.has_role(p_user_id uuid, p_roles public.app_role[])
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.role_assignments
    where user_id = p_user_id
      and status = 'active'
      and role = any(p_roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- JWT custom claims — surfaces the user's highest-priority active role as
-- `user_role` (NOT `role` — PostgREST reserves that claim to switch Postgres
-- roles between anon/authenticated, so overloading it would break auth).
-- Wiring this as the live Auth Hook still needs one manual step: Authentication
-- -> Hooks -> Customize Access Token (JWT) Claims hook -> select this function.
-- ---------------------------------------------------------------------------
create function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  claims jsonb;
  selected_role public.app_role;
begin
  claims := event -> 'claims';

  select role into selected_role
  from public.role_assignments
  where user_id = (event ->> 'user_id')::uuid
    and status = 'active'
  order by case role
    when 'super' then 1
    when 'admin' then 2
    when 'ops' then 3
    when 'coach' then 4
    when 'supplier' then 5
    else 6
  end
  limit 1;

  claims := jsonb_set(claims, '{user_role}', to_jsonb(coalesce(selected_role::text, 'client')));
  event := jsonb_set(event, '{claims}', claims);
  return event;
end;
$$;

-- security definer runs the function body as its owner (postgres), but
-- supabase_auth_admin still needs USAGE on the schema just to look up and
-- invoke the function by name — EXECUTE on the function alone isn't enough.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook from authenticated, anon, public;

-- ---------------------------------------------------------------------------
-- Ticket-traceability spine (STITCHD-SRS-SDS.md §B7)
-- ---------------------------------------------------------------------------
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  entity_type text not null,
  entity_id uuid,
  actor_id uuid references auth.users (id),
  actor_role text,
  from_state text,
  to_state text,
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  at timestamptz not null default now()
);

create index activity_log_ref_idx on public.activity_log (ref);
create index activity_log_entity_idx on public.activity_log (entity_type, entity_id);

-- Generates human-readable ST-<TYPE>-##### refs from a per-type Postgres
-- sequence, created on first use so new ticket types need no new migration.
-- security definer: creating a new sequence needs CREATE on the schema,
-- which only the owner (postgres) has — callers (service_role etc.) only
-- ever get USAGE. Same class of bug as custom_access_token_hook's earlier;
-- caught late here because Phase 1 only ever exercised this connected
-- directly as postgres, never through a restricted role.
create function public.next_ref(p_type text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  seq_name text := 'ref_seq_' || lower(p_type);
  v bigint;
begin
  execute format('create sequence if not exists public.%I', seq_name);
  execute format('select nextval(%L)', 'public.' || seq_name) into v;
  return 'ST-' || upper(p_type) || '-' || lpad(v::text, 5, '0');
end;
$$;

-- Transactional-outbox trigger: writes one activity_log row per INSERT, and
-- per UPDATE where `status` actually changed. security definer so it can
-- write to activity_log regardless of the calling role's own grants (clients
-- never get direct INSERT on activity_log).
create function public.log_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
  v_from text;
  v_to text;
begin
  if TG_OP = 'UPDATE' then
    v_from := to_jsonb(old) ->> 'status';
    v_to := to_jsonb(new) ->> 'status';
    if v_from is not distinct from v_to then
      return new;
    end if;
  else
    v_to := coalesce(to_jsonb(new) ->> 'status', 'created');
  end if;

  v_ref := coalesce(to_jsonb(new) ->> 'ref', TG_TABLE_NAME || ':' || new.id::text);

  insert into public.activity_log (ref, entity_type, entity_id, actor_id, actor_role, from_state, to_state, event, payload)
  values (
    v_ref,
    TG_TABLE_NAME,
    new.id,
    auth.uid(),
    nullif(auth.jwt() ->> 'user_role', ''),
    v_from,
    v_to,
    TG_TABLE_NAME || '.' || lower(TG_OP) || 'd',
    to_jsonb(new)
  );
  return new;
end;
$$;

create trigger role_assignments_audit
  after insert or update on public.role_assignments
  for each row execute function public.log_activity();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.orgs enable row level security;
alter table public.profiles enable row level security;
alter table public.role_assignments enable row level security;
alter table public.activity_log enable row level security;

create policy orgs_select on public.orgs for select to authenticated
  using (
    id in (select org_id from public.role_assignments where user_id = auth.uid())
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );

create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy role_assignments_select_own on public.role_assignments for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

create policy activity_log_select_own on public.activity_log for select to authenticated
  using (actor_id = auth.uid() or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

-- No client-facing insert/update/delete policies on orgs, role_assignments,
-- or activity_log: those are side-effecting writes and per STITCHD-SRS-SDS.md
-- §13.1's own rule of thumb ("writes with side-effects via /api/v1/* Edge
-- Functions"), they go through service-role-backed Edge Functions, which
-- bypass RLS entirely rather than needing a policy.
