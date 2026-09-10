-- Part F: RSVP reminders before the guest-count cutoff.
--
-- STITCHD never holds guest contact details — the host mints an invitation
-- token and distributes the link through their own channel (see
-- rsvp-publish-invitation). So the reminder can only go to the HOST: "the
-- cutoff for <function> is in N days and M households still haven't replied
-- — chase them from your RSVP manager." Enqueued into notification_queue
-- (WBS-05) and deduped by intent key, so the hourly scan produces at most
-- one 7-day nudge and one 2-day nudge per function.
create function public.rsvp_enqueue_reminders()
returns table (function_id uuid, marker text, outstanding int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_fn record;
  v_marker text;
  v_days int;
  v_outstanding int;
  v_phone text;
begin
  for v_fn in
    select f.id, f.name, f.rsvp_cutoff_at, f.event_id, e.owner_id
    from public.functions f
    join public.events e on e.id = f.event_id
    where f.rsvp_cutoff_at is not null
      and f.rsvp_cutoff_at > now()
      and f.rsvp_cutoff_at <= now() + interval '7 days'
  loop
    -- The nearer marker wins: inside 2 days it's the 2-day nudge, otherwise
    -- the 7-day one. A function created with the cutoff already inside 2
    -- days only ever gets the 2-day nudge, which is correct — there's no
    -- 7-day warning to give for something due the day after tomorrow.
    if v_fn.rsvp_cutoff_at <= now() + interval '2 days' then
      v_marker := '2d'; v_days := 2;
    else
      v_marker := '7d'; v_days := 7;
    end if;

    -- Households that were actually sent a link (published invitation) and
    -- still have at least one guest whose answer for this function isn't in.
    select count(distinct g.household_id) into v_outstanding
    from public.guests g
    join public.guest_responses gr on gr.guest_id = g.id and gr.function_id = v_fn.id
    join public.invitations inv on inv.household_id = g.household_id and inv.state = 'published'
    where gr.state in ('not_responded', 'draft');

    if v_outstanding = 0 then
      continue;
    end if;

    select phone into v_phone from public.profiles where id = v_fn.owner_id;

    insert into public.notification_queue (intent_key, ref, template, to_phone, to_user_id, vars)
    values (
      'rsvp_reminder:' || v_fn.id || ':' || v_marker,
      v_fn.id::text,
      'rsvp_reminder',
      v_phone,
      v_fn.owner_id,
      jsonb_build_object('function', v_fn.name, 'days', v_days::text, 'outstanding', v_outstanding::text)
    )
    on conflict (intent_key) do nothing;

    function_id := v_fn.id;
    marker := v_marker;
    outstanding := v_outstanding;
    return next;
  end loop;
end;
$$;
grant execute on function public.rsvp_enqueue_reminders() to service_role;

-- Hourly is plenty — the intent-key dedup makes it idempotent, and a nudge
-- landing a few hours late against a 7-day / 2-day horizon is immaterial.
select cron.schedule('rsvp-reminders', '0 * * * *', $$select public.rsvp_enqueue_reminders()$$);

-- Fold the new job into the same pause switch the test suite already uses,
-- so an hourly reminder scan can't race a test that's manipulating
-- functions / guest_responses / notification_queue.
create or replace function public.set_scheduled_jobs_active(p_active boolean)
returns void
language plpgsql
security definer
set search_path = public, cron
as $$
declare
  r record;
begin
  for r in select jobid from cron.job
    where jobname in ('ticket-escalation', 'drain-notification-queue', 'rsvp-reminders')
  loop
    perform cron.alter_job(job_id := r.jobid, active := p_active);
  end loop;
end;
$$;
grant execute on function public.set_scheduled_jobs_active(boolean) to service_role;
