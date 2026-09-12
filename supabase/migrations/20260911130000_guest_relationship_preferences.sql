-- Part F2 completion — Merc's own testing feedback: "its missing editing
-- guest Preferences or Relationship." `relationship` is host-only
-- categorisation (never shown to the guest), safe to edit directly.
-- Preferences (meal/dietary/plus-one) are normally guest-submitted via
-- rsvp-submit-response — this adds a narrow, column-guarded path for the
-- host to set or correct them directly (a guest who phones it in rather
-- than using their link), while the guest's own answer/state/revision/
-- pending_change stay pinned to the real RSVP flow, so a direct host edit
-- can never silently flip or fast-forward someone's actual RSVP — same
-- "prove ownership, still don't own every column" guard as
-- suppliers_guard_privileged_columns (WBS-01).
alter table public.guests add column relationship text;

create policy guests_update on public.guests for update to authenticated
  using (
    household_id in (select h.id from public.households h join public.events e on e.id = h.event_id where e.owner_id = auth.uid())
  )
  with check (
    household_id in (select h.id from public.households h join public.events e on e.id = h.event_id where e.owner_id = auth.uid())
  );

create policy guest_responses_update_host on public.guest_responses for update to authenticated
  using (
    guest_id in (
      select g.id from public.guests g
      join public.households h on h.id = g.household_id
      join public.events e on e.id = h.event_id
      where e.owner_id = auth.uid()
    )
  )
  with check (
    guest_id in (
      select g.id from public.guests g
      join public.households h on h.id = g.household_id
      join public.events e on e.id = h.event_id
      where e.owner_id = auth.uid()
    )
  );

create function public.guest_responses_guard_host_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user = 'service_role' then
    return new;
  end if;
  new.answer := old.answer;
  new.state := old.state;
  new.revision := old.revision;
  new.pending_change := old.pending_change;
  new.guest_id := old.guest_id;
  new.function_id := old.function_id;
  return new;
end;
$$;
create trigger guest_responses_guard_host_columns
  before update on public.guest_responses
  for each row execute function public.guest_responses_guard_host_columns();
