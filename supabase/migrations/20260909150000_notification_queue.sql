-- WBS-05 (Part I1's own gap, stated plainly in the spec itself): "message_log
-- and webhook_deliveries record what happened; the queue table, lease and
-- retry worker that make delivery eventually succeed are the missing piece."
-- This is that queue. Provider-calling logic stays in notify() (Deno) —
-- this table and the processor around it add the retry/lease/dead-letter
-- mechanism notify() was never meant to own itself.
create table public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  -- "The unique intent key includes entity, revision, recipient, channel
  -- and template" — enforced here as a real unique constraint, not a
  -- convention. A caller re-enqueueing the same intent gets a harmless
  -- conflict (insert ... on conflict (intent_key) do nothing), not a
  -- duplicate send.
  intent_key text not null unique,
  ref text not null,
  template text not null,
  to_phone text,
  to_user_id uuid references auth.users (id),
  vars jsonb not null default '{}',
  state text not null default 'queued' check (state in ('queued', 'leased', 'sent', 'failed', 'suppressed', 'unknown')),
  attempts int not null default 0,
  max_attempts int not null default 5,
  leased_until timestamptz,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notification_queue_due_idx on public.notification_queue (next_attempt_at)
  where state in ('queued', 'failed');
alter table public.notification_queue enable row level security;

-- Dead-letter visibility in the Admin Console (Part I1) — admin/super
-- read-only. No client-facing write policy at all: every real row is
-- inserted by an Edge Function or a SECURITY DEFINER trigger using the
-- service role, same "service role is the only door in" idiom used
-- throughout this project's privileged tables.
create policy notification_queue_select on public.notification_queue for select to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

alter publication supabase_realtime add table public.notification_queue;

-- Claims up to p_limit due rows atomically (for update skip locked — "A
-- minute scheduler claims each escalation once"; concurrent processor runs
-- never double-lease the same row) and marks them leased. The caller
-- (notifications-process) does the actual send, then reports the outcome
-- back via notification_queue_report below. A crashed run's lease expires
-- on its own — nothing else needs to notice or clean up after it.
create function public.notification_queue_claim(p_limit int default 20, p_lease_seconds int default 120)
returns setof public.notification_queue
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  update public.notification_queue q
  set state = 'leased', leased_until = now() + (p_lease_seconds || ' seconds')::interval, updated_at = now()
  where q.id in (
    select id from public.notification_queue
    where (state in ('queued', 'failed') and next_attempt_at <= now())
       or (state = 'leased' and leased_until < now()) -- a crashed run's stale lease is fair game again
    order by next_attempt_at
    limit p_limit
    for update skip locked
  )
  returning q.*;
end;
$$;

create function public.notification_queue_report(p_id uuid, p_outcome text, p_error text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.notification_queue;
begin
  select * into v_row from public.notification_queue where id = p_id;
  if v_row.id is null then
    raise exception 'notification_queue row % not found', p_id;
  end if;

  if p_outcome = 'sent' then
    update public.notification_queue set state = 'sent', updated_at = now() where id = p_id;
  elsif p_outcome = 'suppressed' then
    -- notify() itself said "nowhere to send this" (no number, unconfigured
    -- provider) — retrying changes nothing, so this isn't a failure to
    -- chase, just a fact to record.
    update public.notification_queue set state = 'suppressed', updated_at = now() where id = p_id;
  else
    -- Exponential-ish backoff: 1m, 5m, 15m, 1h, then dead-letter.
    update public.notification_queue
    set state = case when v_row.attempts + 1 >= v_row.max_attempts then 'unknown' else 'failed' end,
        attempts = v_row.attempts + 1,
        next_attempt_at = now() + (power(5, v_row.attempts) || ' minutes')::interval,
        last_error = p_error,
        updated_at = now()
    where id = p_id;
  end if;
end;
$$;

grant execute on function public.notification_queue_claim(int, int) to service_role;
grant execute on function public.notification_queue_report(uuid, text, text) to service_role;
