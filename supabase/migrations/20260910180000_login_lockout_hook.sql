-- Part K1: "5 failed attempts per 15 minutes per account + IP" for login.
--
-- Earlier passes left this to GoTrue's built-in IP-only limiter and said
-- so — an account-specific limiter was flagged as needing a proxy in front
-- of GoTrue. It doesn't: GoTrue's own `password_verification_attempt` auth
-- hook runs server-side after every password check, receives the user_id
-- and whether the password was valid, and can reject. Same pg-function
-- hook mechanism as before_user_created_hook.
--
-- What the hook payload does NOT carry is the caller IP, so this is "per
-- account" only — the "+ IP" half still isn't enforceable here. The account
-- is the axis that matters for credential stuffing; the IP limiter GoTrue
-- already runs covers the other. Stated, not silently dropped.

create table public.auth_failed_logins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  created_at timestamptz not null default now()
);
create index auth_failed_logins_lookup on public.auth_failed_logins (user_id, created_at);
alter table public.auth_failed_logins enable row level security;
-- No policies at all — only the SECURITY DEFINER hook (running as
-- supabase_auth_admin) ever touches this table.

create function public.password_verification_attempt_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_window   constant interval := interval '15 minutes';
  c_max      constant int := 5;
  v_user_id  uuid := nullif(event ->> 'user_id', '')::uuid;
  v_valid    boolean := coalesce((event ->> 'valid')::boolean, false);
  v_recent   int;
begin
  if v_user_id is null then
    return jsonb_build_object('decision', 'continue');
  end if;

  select count(*) into v_recent
  from public.auth_failed_logins
  where user_id = v_user_id and created_at > now() - c_window;

  -- Already locked: reject regardless of whether this password was right.
  -- A correct password mid-lockout still waits out the window — that's the
  -- point of a lockout.
  if v_recent >= c_max then
    return jsonb_build_object(
      'decision', 'reject',
      'message', 'Too many failed sign-in attempts for this account. Try again in 15 minutes.'
    );
  end if;

  if v_valid then
    -- Clean slate on a real sign-in.
    delete from public.auth_failed_logins where user_id = v_user_id;
    return jsonb_build_object('decision', 'continue');
  end if;

  -- A failure. Record it, and if it's the one that hits the ceiling, reject
  -- this attempt too so the count and the lockout line up exactly.
  insert into public.auth_failed_logins (user_id) values (v_user_id);
  if v_recent + 1 >= c_max then
    return jsonb_build_object(
      'decision', 'reject',
      'message', 'Too many failed sign-in attempts for this account. Try again in 15 minutes.'
    );
  end if;

  return jsonb_build_object('decision', 'continue');
end;
$$;

-- Same grant shape as before_user_created_hook: only GoTrue's own role may
-- call it.
grant execute on function public.password_verification_attempt_hook to supabase_auth_admin;
revoke execute on function public.password_verification_attempt_hook from authenticated, anon, public;

-- Housekeeping: an old failed-login row is noise after its window. A daily
-- sweep keeps the table from growing without bound (the hook's own query is
-- already time-bounded, so stale rows never affect a decision).
select cron.schedule('sweep-failed-logins', '17 3 * * *',
  $$delete from public.auth_failed_logins where created_at < now() - interval '1 day'$$);
