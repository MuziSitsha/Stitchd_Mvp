-- WBS-05/07 follow-up: make the reliability spine autonomous. Until now
-- notification_queue draining and ticket escalation only happened when an
-- admin manually triggered them — the durability was real (rows persist,
-- leases expire, retries are scheduled) but nothing was turning the crank.
-- "A minute scheduler claims each escalation once" (Part H2) — this is that
-- minute scheduler.
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Ticket escalation is pure SQL (it enqueues into notification_queue, never
-- calls a provider), so cron runs it directly — no HTTP round trip.
select cron.schedule('ticket-escalation', '* * * * *', $$select public.tickets_escalate()$$);

-- Draining the queue needs the Edge Function (notify() is Deno — it renders
-- templates and talks to WhatsApp/Clickatell). URL + service key come from
-- Vault so this migration is byte-identical local and hosted; whoever
-- deploys sets the two secrets. If they're absent the function no-ops and
-- the queue simply waits — nothing is lost, it just doesn't auto-drain
-- until the secrets exist (or an admin drains it by hand from the console).
create function public.drain_notification_queue()
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_base_url text;
  v_key text;
begin
  select decrypted_secret into v_base_url from vault.decrypted_secrets where name = 'edge_function_base_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_base_url is null or v_key is null then
    return;
  end if;
  perform net.http_post(
    url := v_base_url || '/functions/v1/notifications-process',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object('limit', 50)
  );
end;
$$;

select cron.schedule('drain-notification-queue', '* * * * *', $$select public.drain_notification_queue()$$);

-- Lets the test suite pause both jobs for the duration of a run (via
-- vitest globalSetup) so cron isn't racing tests that manipulate the same
-- tickets/notification_queue rows. Not something app code ever calls —
-- service_role only, and the jobs are active in every real deployment.
create function public.set_scheduled_jobs_active(p_active boolean)
returns void
language plpgsql
security definer
set search_path = public, cron
as $$
declare
  r record;
begin
  -- pg_cron revokes direct DML on cron.job — has to go through its own API.
  for r in select jobid from cron.job where jobname in ('ticket-escalation', 'drain-notification-queue') loop
    perform cron.alter_job(job_id := r.jobid, active := p_active);
  end loop;
end;
$$;
grant execute on function public.set_scheduled_jobs_active(boolean) to service_role;
