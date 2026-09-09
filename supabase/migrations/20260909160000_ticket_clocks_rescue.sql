-- WBS-07 (Part H2). Severity targets, computed and enforced, not just
-- columns sitting unused (confirmed absent from every code path before
-- this migration — response_due_at/resolution_due_at existed on tickets
-- since Phase 1 but nothing ever set or checked them).
--
-- Simplification, stated honestly: P2/P3's spec targets are in business
-- hours/days ("4 business hours", "2 business days"); this pass uses
-- straight wall-clock intervals of the same magnitude rather than a real
-- business-calendar engine, which is a materially bigger undertaking on
-- its own. P0/P1 (minutes) are exact either way since business-hours logic
-- doesn't matter at that timescale.
alter table public.tickets add column escalation_level int not null default 0;
alter table public.tickets add column next_update_due_at timestamptz;

-- Anchored to created_at, not now() — "Priority changes preserve elapsed
-- time and audit old and new targets. No reset to hide a breach." A
-- ticket that's already 2 hours old and gets escalated to critical shows
-- its response_due_at as already breached immediately, not a fresh
-- 5-minute grace period from the moment someone noticed.
create function public.tickets_set_clocks()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_ack_minutes int;
  v_update_minutes int;
  v_action_plan_minutes int;
begin
  case new.priority
    when 'critical' then v_ack_minutes := 5; v_update_minutes := 10; v_action_plan_minutes := 15;
    when 'high' then v_ack_minutes := 15; v_update_minutes := 30; v_action_plan_minutes := 60;
    when 'medium' then v_ack_minutes := 240; v_update_minutes := 1440; v_action_plan_minutes := 2880;
    else v_ack_minutes := 1440; v_update_minutes := 2880; v_action_plan_minutes := 7200;
  end case;

  new.response_due_at := new.created_at + (v_ack_minutes || ' minutes')::interval;
  new.resolution_due_at := new.created_at + (v_action_plan_minutes || ' minutes')::interval;
  if new.next_update_due_at is null or tg_op = 'INSERT' then
    new.next_update_due_at := new.created_at + (v_update_minutes || ' minutes')::interval;
  end if;
  return new;
end;
$$;
create trigger tickets_set_clocks
  before insert or update of priority on public.tickets
  for each row execute function public.tickets_set_clocks();

-- Re-run once for every existing ticket so the backfill matches what a
-- fresh insert would have produced — same "the trigger only helps future
-- rows unless you also fix the past" lesson as every other seed trigger
-- added this session.
update public.tickets set priority = priority;

-- ---------------------------------------------------------------------------
-- Escalation. "The first-response clock never pauses. The P2/P3 action-
-- plan clock may pause only in Waiting requester with an explicit
-- question — Waiting external never pauses it." This pass implements the
-- non-pausing case (the common one); a real pause/resume mechanism for
-- the waiting_client state is a follow-up, not attempted here.
--
-- Enqueues into notification_queue (WBS-05) rather than sending directly —
-- exactly the dependency this queue exists to serve.
create function public.tickets_escalate()
returns table (ticket_id uuid, ref text, reason text, new_level int)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ticket record;
  v_owner_id uuid;
begin
  for v_ticket in
    select t.* from public.tickets t
    where t.status not in ('resolved', 'closed')
      and (
        (t.response_due_at < now() and t.status = 'open')
        or (t.next_update_due_at < now())
      )
  loop
    update public.tickets
      set escalation_level = escalation_level + 1,
          next_update_due_at = case when next_update_due_at < now() then now() + interval '30 minutes' else next_update_due_at end
      where id = v_ticket.id
      returning escalation_level into v_ticket.escalation_level;

    select owner_id into v_owner_id from public.events where id = v_ticket.event_id;

    insert into public.notification_queue (intent_key, ref, template, to_user_id, vars)
    values (
      v_ticket.id || ':escalation:' || v_ticket.escalation_level,
      v_ticket.ref, 'ticket_escalated',
      coalesce(v_owner_id, v_ticket.created_by),
      jsonb_build_object('ref', v_ticket.ref, 'clock', case when v_ticket.status = 'open' then 'first-response' else 'next-update' end, 'priority', v_ticket.priority, 'level', v_ticket.escalation_level)
    )
    on conflict (intent_key) do nothing;

    ticket_id := v_ticket.id;
    ref := v_ticket.ref;
    reason := case when v_ticket.status = 'open' then 'first-response breached' else 'next-update breached' end;
    -- v_ticket.escalation_level already holds the post-increment value (the
    -- UPDATE ... RETURNING INTO above reassigned it), so no further +1 here.
    new_level := v_ticket.escalation_level;
    return next;
  end loop;
end;
$$;

grant execute on function public.tickets_escalate() to service_role;

-- ---------------------------------------------------------------------------
-- Rescue (Part H2): "no automatic booking, no unfunded float, no
-- replacement guarantee." Every column here is named directly from the
-- spec's own sentence: "Rescue records candidate, availability-confirmed-
-- at, contact evidence, cost, decision and outcome."
create table public.rescue_requests (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.next_ref('RSC'),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  candidate_supplier_id uuid references public.suppliers (id),
  candidate_name text,
  availability_confirmed_at timestamptz,
  contact_evidence text,
  cost_cents int,
  capped_spend_cents int,
  decision text not null default 'pending' check (decision in ('pending', 'approved', 'declined')),
  approved_by uuid references auth.users (id),
  approved_at timestamptz,
  outcome text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index rescue_requests_ticket_idx on public.rescue_requests (ticket_id);
alter table public.rescue_requests enable row level security;

-- Same ownership idiom as tickets itself: the event owner (or a supplier
-- addressed by the ticket) can see and create; only the owner or admin
-- may decide (enforced in the approve Edge Function, not by RLS alone,
-- since "the Owner or a valid delegate approves" is a judgment call an Edge
-- Function can make explicitly rather than a blanket table policy).
create policy rescue_requests_select on public.rescue_requests for select to authenticated
  using (
    ticket_id in (
      select t.id from public.tickets t
      left join public.events e on e.id = t.event_id
      left join public.suppliers s on s.id = t.supplier_id
      where e.owner_id = auth.uid() or s.profile_id = auth.uid() or t.created_by = auth.uid()
    )
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );
create policy rescue_requests_insert on public.rescue_requests for insert to authenticated
  with check (
    created_by = auth.uid()
    and ticket_id in (
      select t.id from public.tickets t
      left join public.events e on e.id = t.event_id
      where e.owner_id = auth.uid()
    )
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );

alter publication supabase_realtime add table public.rescue_requests;
