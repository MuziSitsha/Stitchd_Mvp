-- Part H2: P2/P3 ticket targets are stated in business time — "4 business
-- hours", "1 business day", "2 business days", "5 business days". The
-- original tickets_set_clocks() (20260909160000) used straight wall-clock
-- intervals of the same magnitude and said so plainly. This closes that
-- gap: P2/P3 clocks now advance only through business hours; P0/P1 stay
-- wall-clock (minutes — a business calendar is meaningless at that scale,
-- and a critical incident doesn't wait for Monday).
--
-- Business calendar: Mon–Fri, 08:00–17:00 Africa/Johannesburg (nine hours
-- a day). Public holidays are NOT modelled — that needs a maintained
-- holiday table and is a follow-on; stated here rather than pretended.

create function public.business_hours_add(p_from timestamptz, p_minutes int)
returns timestamptz
language plpgsql
stable
set search_path = public
as $$
declare
  c_tz        constant text := 'Africa/Johannesburg';
  c_start     constant int  := 8;   -- 08:00
  c_end       constant int  := 17;  -- 17:00
  v_local     timestamp;
  v_remaining int := greatest(coalesce(p_minutes, 0), 0);
  v_day_start timestamp;
  v_day_end   timestamp;
  v_avail     int;
begin
  v_local := p_from at time zone c_tz;

  loop
    -- Saturday (6) / Sunday (7): jump to Monday 08:00.
    while extract(isodow from v_local) >= 6 loop
      v_local := date_trunc('day', v_local) + interval '1 day' + make_interval(hours => c_start);
    end loop;

    v_day_start := date_trunc('day', v_local) + make_interval(hours => c_start);
    v_day_end   := date_trunc('day', v_local) + make_interval(hours => c_end);

    if v_local < v_day_start then
      v_local := v_day_start;             -- before the window opens
    end if;
    if v_local >= v_day_end then          -- after it closes → next day, weekends handled at loop top
      v_local := date_trunc('day', v_local) + interval '1 day' + make_interval(hours => c_start);
      continue;
    end if;

    exit when v_remaining = 0;

    v_avail := ceil(extract(epoch from (v_day_end - v_local)) / 60)::int;
    if v_remaining <= v_avail then
      v_local := v_local + make_interval(mins => v_remaining);
      v_remaining := 0;
      exit;
    end if;
    v_remaining := v_remaining - v_avail;
    v_local := date_trunc('day', v_local) + interval '1 day' + make_interval(hours => c_start);
  end loop;

  return v_local at time zone c_tz;
end;
$$;
grant execute on function public.business_hours_add(timestamptz, int) to authenticated, service_role;

create or replace function public.tickets_set_clocks()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_ack_minutes int;
  v_update_minutes int;
  v_action_plan_minutes int;
  v_business boolean := false;
begin
  case new.priority
    -- P0/P1: wall-clock minutes, exactly as before.
    when 'critical' then v_ack_minutes := 5; v_update_minutes := 10; v_action_plan_minutes := 15;
    when 'high'     then v_ack_minutes := 15; v_update_minutes := 30; v_action_plan_minutes := 60;
    -- P2/P3: business-time targets (4 business hours / 1 / 2 / 5 business
    -- days at 9 business hours a day = 540 minutes).
    when 'medium'   then v_ack_minutes := 240;  v_update_minutes := 540;  v_action_plan_minutes := 1080; v_business := true;
    else                 v_ack_minutes := 540;  v_update_minutes := 1080; v_action_plan_minutes := 2700; v_business := true;
  end case;

  -- Still anchored to created_at, never now() — "Priority changes preserve
  -- elapsed time and audit old and new targets. No reset to hide a breach."
  if v_business then
    new.response_due_at   := public.business_hours_add(new.created_at, v_ack_minutes);
    new.resolution_due_at := public.business_hours_add(new.created_at, v_action_plan_minutes);
    if new.next_update_due_at is null or tg_op = 'INSERT' then
      new.next_update_due_at := public.business_hours_add(new.created_at, v_update_minutes);
    end if;
  else
    new.response_due_at   := new.created_at + (v_ack_minutes || ' minutes')::interval;
    new.resolution_due_at := new.created_at + (v_action_plan_minutes || ' minutes')::interval;
    if new.next_update_due_at is null or tg_op = 'INSERT' then
      new.next_update_due_at := new.created_at + (v_update_minutes || ' minutes')::interval;
    end if;
  end if;
  return new;
end;
$$;

-- Re-run for every existing ticket so the backfill matches what a fresh
-- insert now produces — same discipline as the original migration.
update public.tickets set priority = priority;
