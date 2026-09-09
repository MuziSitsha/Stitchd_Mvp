-- WBS-K (Part K1's own anti-abuse table, with its exact numbers): login
-- limiting is left to Supabase Auth's built-in IP-based limiter
-- (auth.rate_limit in config.toml) — it's not account-specific the way the
-- spec literally describes ("5 failed attempts per 15 minutes per account
-- + IP"), which would need a custom login proxy in front of GoTrue to do
-- faithfully. Stated as a real gap, not silently claimed as done. This
-- migration covers the three limits actually enforceable at the
-- application layer with the spec's own exact numbers: RSVP writes, lead
-- creation, guest import.
create table public.rate_limit_hits (
  id uuid primary key default gen_random_uuid(),
  bucket text not null,
  key text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_hits_lookup_idx on public.rate_limit_hits (bucket, key, created_at);
alter table public.rate_limit_hits enable row level security;
-- No client-facing policy at all — every call to check_rate_limit runs as
-- the calling Edge Function's own service-role client, never a browser
-- session directly.

-- Counts hits in the current window and records this one atomically —
-- "atomically" matters here specifically: two concurrent requests racing
-- each other must not both read the same under-limit count and both pass.
-- An advisory lock scoped to this one bucket+key (not a table-wide lock)
-- serializes only concurrent checks that could actually race each other —
-- checks against a different bucket or key never wait on this one.
create function public.check_rate_limit(p_bucket text, p_key text, p_max_count int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_bucket || ':' || p_key, 0));
  select count(*) into v_count from public.rate_limit_hits
    where bucket = p_bucket and key = p_key and created_at > now() - (p_window_seconds || ' seconds')::interval;
  if v_count >= p_max_count then
    return false;
  end if;
  insert into public.rate_limit_hits (bucket, key) values (p_bucket, p_key);
  return true;
end;
$$;
grant execute on function public.check_rate_limit(text, text, int, int) to service_role;
