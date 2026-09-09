-- WBS-04 (Part G1 — explainable readiness). Unblocked by WBS-02's bookings
-- table: readiness is scored per booking, not per ticket or quote.
--
-- Six standard obligations per booking (Part G1's own weight table),
-- seeded automatically at booking creation — same "seed at the source"
-- lesson as events_seed_owner_membership (WBS-02) and
-- households_seed_invitation (WBS-03): a rule discovered by hand once and
-- then forgotten for every booking created afterward is worse than no rule
-- at all.
create table public.obligations (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  rule_key text not null check (rule_key in ('confirmed_scope', 'deposit_evidence', 'named_contact', 'arrival_plan', 'category_evidence', 'reconfirmation')),
  weight int not null check (weight > 0),
  applicable boolean not null default true,
  state text not null default 'unsatisfied' check (state in ('unsatisfied', 'satisfied')),
  due_at timestamptz,
  evidence_note text,
  updated_at timestamptz not null default now(),
  unique (booking_id, rule_key)
);
create index obligations_booking_idx on public.obligations (booking_id);
alter table public.obligations enable row level security;

-- Ownership chain: booking -> quote_version -> quote -> supplier_ticket ->
-- event.owner_id. Host (Operations, per Part G1's own "primary reader"
-- column) reads and updates their own event's obligations; admin sees and
-- edits everything. Not exposed to suppliers at all — Part B2's actor
-- table doesn't give suppliers a readiness scope, and neither does this.
create policy obligations_select on public.obligations for select to authenticated
  using (
    booking_id in (
      select b.id from public.bookings b
      join public.quote_versions qv on qv.id = b.quote_version_id
      join public.quotes q on q.id = qv.quote_id
      join public.supplier_tickets st on st.id = q.ticket_id
      join public.events e on e.id = st.event_id
      where e.owner_id = auth.uid()
    )
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );
create policy obligations_update on public.obligations for update to authenticated
  using (
    booking_id in (
      select b.id from public.bookings b
      join public.quote_versions qv on qv.id = b.quote_version_id
      join public.quotes q on q.id = qv.quote_id
      join public.supplier_tickets st on st.id = q.ticket_id
      join public.events e on e.id = st.event_id
      where e.owner_id = auth.uid()
    )
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  )
  with check (
    booking_id in (
      select b.id from public.bookings b
      join public.quote_versions qv on qv.id = b.quote_version_id
      join public.quotes q on q.id = qv.quote_id
      join public.supplier_tickets st on st.id = q.ticket_id
      join public.events e on e.id = st.event_id
      where e.owner_id = auth.uid()
    )
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );

alter publication supabase_realtime add table public.obligations;

create function public.bookings_seed_obligations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.obligations (booking_id, rule_key, weight, due_at) values
    (new.id, 'confirmed_scope', 25, null),
    (new.id, 'deposit_evidence', 15, null),
    (new.id, 'named_contact', 15, null),
    (new.id, 'arrival_plan', 15, null),
    (new.id, 'category_evidence', 20, null),
    (new.id, 'reconfirmation', 10, now() + interval '30 days');
  return new;
end;
$$;
create trigger bookings_seed_obligations
  after insert on public.bookings
  for each row execute function public.bookings_seed_obligations();

-- Backfill: the 7 bookings already created by WBS-02's backfill (and any
-- created live since via quotes-respond) never got obligations at all —
-- same class of gap as the events_seed_owner_membership fix, caught before
-- it could repeat.
insert into public.obligations (booking_id, rule_key, weight, due_at)
select b.id, r.rule_key, r.weight, case when r.rule_key = 'reconfirmation' then now() + interval '30 days' else null end
from public.bookings b
cross join (values
  ('confirmed_scope', 25), ('deposit_evidence', 15), ('named_contact', 15),
  ('arrival_plan', 15), ('category_evidence', 20), ('reconfirmation', 10)
) as r(rule_key, weight)
where not exists (select 1 from public.obligations o where o.booking_id = b.id and o.rule_key = r.rule_key);

-- ---------------------------------------------------------------------------
-- Explainable readiness v1 (Part G1's own formula, band table, and rules):
-- score = round(100 x satisfied applicable weight / all applicable weight).
-- Zero applicable obligations -> null score, "grey" band, never 100%.
-- Critical blocker (a declined supplier_ticket, the one unambiguous signal
-- available in this pass) forces red regardless of score. A non-critical
-- overdue obligation caps the band at amber even at 85+.
create function public.booking_readiness(p_booking_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_applicable_weight int;
  v_satisfied_weight int;
  v_score int;
  v_band text;
  v_has_critical_blocker boolean;
  v_has_overdue boolean;
begin
  select coalesce(sum(weight) filter (where applicable), 0),
         coalesce(sum(weight) filter (where applicable and state = 'satisfied'), 0)
    into v_applicable_weight, v_satisfied_weight
    from public.obligations where booking_id = p_booking_id;

  select exists (
    select 1 from public.bookings b
    join public.quote_versions qv on qv.id = b.quote_version_id
    join public.quotes q on q.id = qv.quote_id
    join public.supplier_tickets st on st.id = q.ticket_id
    where b.id = p_booking_id and st.status = 'declined'
  ) into v_has_critical_blocker;

  select exists (
    select 1 from public.obligations
    where booking_id = p_booking_id and applicable and state = 'unsatisfied' and due_at is not null and due_at < now()
  ) into v_has_overdue;

  if v_applicable_weight = 0 then
    v_score := null;
    v_band := 'grey';
  else
    v_score := round(100.0 * v_satisfied_weight / v_applicable_weight);
    if v_has_critical_blocker or v_score < 60 then
      v_band := 'red';
    elsif v_score < 85 or v_has_overdue then
      v_band := 'amber';
    else
      v_band := 'green';
    end if;
  end if;

  -- rule_version + calculated_at on every score (Part G1: "Record rule
  -- version, evidence IDs and calculation timestamp on every score") —
  -- computed live rather than cached, so it's never stale, and reproducible
  -- from the current obligations rows rather than trusted blindly.
  return jsonb_build_object(
    'booking_id', p_booking_id,
    'score', v_score,
    'band', v_band,
    'satisfied_weight', v_satisfied_weight,
    'applicable_weight', v_applicable_weight,
    'has_critical_blocker', v_has_critical_blocker,
    'has_overdue', v_has_overdue,
    'rule_version', 1,
    'calculated_at', now()
  );
end;
$$;
-- security invoker (the default, stated explicitly): this must run as the
-- calling user so its own internal queries are subject to the same RLS as
-- everything else — a host must not be able to read another host's
-- obligations just by knowing a booking_id and calling this function.
grant execute on function public.booking_readiness(uuid) to authenticated;

-- Event-level rollup: "Event status is the worst critical booking status.
-- Display coverage as assessed required bookings over all required
-- bookings — do not average away a missing venue." Worst-first ordering:
-- red > amber > green > grey (grey is "not yet assessed", not "bad").
create function public.event_readiness(p_event_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_booking record;
  v_bands text[] := '{}';
  v_required_count int := 0;
  v_assessed_count int := 0;
  v_worst text := 'grey';
begin
  for v_booking in
    select b.id from public.bookings b
    join public.quote_versions qv on qv.id = b.quote_version_id
    join public.quotes q on q.id = qv.quote_id
    join public.supplier_tickets st on st.id = q.ticket_id
    where st.event_id = p_event_id
  loop
    v_required_count := v_required_count + 1;
    declare
      v_result jsonb := public.booking_readiness(v_booking.id);
    begin
      if (v_result->>'band') <> 'grey' then
        v_assessed_count := v_assessed_count + 1;
      end if;
      v_bands := array_append(v_bands, v_result->>'band');
    end;
  end loop;

  if 'red' = any(v_bands) then v_worst := 'red';
  elsif 'amber' = any(v_bands) then v_worst := 'amber';
  elsif 'green' = any(v_bands) then v_worst := 'green';
  else v_worst := 'grey';
  end if;

  return jsonb_build_object(
    'event_id', p_event_id,
    'required_count', v_required_count,
    'assessed_count', v_assessed_count,
    'worst_band', v_worst,
    'calculated_at', now()
  );
end;
$$;
grant execute on function public.event_readiness(uuid) to authenticated;
