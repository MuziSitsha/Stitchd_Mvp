-- Part C1 / Part M3: "Keep signup disabled until G1... The server enforces
-- the launch flag, so a direct API call cannot bypass the closed gate."
-- A UI-only "Pilot onboarding is not open yet" state is not enough — the
-- gate has to hold against someone POSTing straight at GoTrue.
create table public.platform_settings (
  id int primary key default 1 check (id = 1), -- singleton row
  signup_open boolean not null default false,
  contact_interest_form_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id)
);
insert into public.platform_settings (id) values (1);
alter table public.platform_settings enable row level security;

-- Public read — the landing page renders its CTAs off this, unauthenticated.
create policy platform_settings_select on public.platform_settings for select using (true);
-- Admin/super only may flip the flags (from Admin Console).
create policy platform_settings_update on public.platform_settings for update to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]))
  with check (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

alter publication supabase_realtime add table public.platform_settings;

-- ---------------------------------------------------------------------------
-- GoTrue before-user-created hook (same pg-function hook mechanism as the
-- already-wired custom_access_token_hook). Rejects a public signup while
-- signup_open is false — but lets staff-provisioned synthetic accounts
-- (Part A1: "use synthetic accounts and staff demonstrations") through,
-- keyed on an app_metadata marker only the admin API / service role can
-- set. A normal signup's options.data lands in user_metadata, never
-- app_metadata, so it can't forge this.
create function public.before_user_created_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_signup_open boolean;
  v_app_metadata jsonb;
begin
  v_app_metadata := coalesce(
    event -> 'user' -> 'app_metadata',
    event -> 'app_metadata',
    '{}'::jsonb
  );
  if (v_app_metadata ->> 'provisioned') = 'true' then
    return event;
  end if;

  select signup_open into v_signup_open from public.platform_settings where id = 1;
  if coalesce(v_signup_open, false) then
    return event;
  end if;

  return jsonb_build_object(
    'error', jsonb_build_object('http_code', 403, 'message', 'Pilot onboarding is not open yet.')
  );
end;
$$;
grant execute on function public.before_user_created_hook to supabase_auth_admin;
revoke execute on function public.before_user_created_hook from authenticated, anon, public;
