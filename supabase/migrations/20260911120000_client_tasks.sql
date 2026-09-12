-- Merc's own testing feedback: "the Tasks are not linked to anything, if u
-- click them they just say completed when it should create a ticket or
-- move it to whom responsible, remember no dead tickets." The client's
-- "This week" task list (Today/Week lenses) was pure client-side mock
-- state — completing a task flipped a boolean in memory and nothing else
-- existed anywhere. `tickets` already has a `category = 'task'` option
-- (Phase C's own design); this wires the client's task list to real rows
-- there instead of inventing a parallel table.
--
-- A personal task differs from the general_tickets.sql support/dispute
-- workflow in two ways: it needs a title/note/due-date/assignee a support
-- ticket never did (new columns below), and the client alone drives it
-- through a short two-state loop instead of the multi-party workflow
-- (tickets-transition's own diff, not this migration). Client creation
-- itself needs no new policy — 20260828130000_client_tickets.sql already
-- lets a client raise any category of ticket about their own event.
alter table public.tickets add column title text;
alter table public.tickets add column note text;
alter table public.tickets add column due_at timestamptz;
alter table public.tickets add column assigned_label text;

-- Personal tasks skip the escalation/breach pipeline entirely — "no dead
-- tickets" means every task is now a real, auditable row, not that a
-- couple's own to-do list should breach an SLA clock and page Ops the way
-- a stalled support ticket does. tickets_set_clocks (WBS-07) still stamps
-- response/resolution due-ats on insert (harmless, just unused for tasks);
-- this is the one place that matters — the minute-scheduler's own query.
create or replace function public.tickets_escalate()
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
    where t.category <> 'task'
      and t.status not in ('resolved', 'closed')
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
    new_level := v_ticket.escalation_level;
    return next;
  end loop;
end;
$$;

grant execute on function public.tickets_escalate() to service_role;
