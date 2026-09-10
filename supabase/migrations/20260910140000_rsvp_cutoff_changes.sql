-- Part F2 completion: the guest-count cutoff and the post-cutoff change
-- workflow. "Corrections stay open until cutoff. After cutoff, the guest
-- submits a change request for host approval... After cutoff: requested ->
-- host_approved / declined — only approval changes counts."
alter table public.functions add column rsvp_cutoff_at timestamptz;

-- pending_change holds what the guest asked for while a submitted answer
-- stays put until the host decides. state 'change_requested' is the
-- post-cutoff limbo; approving applies pending_change and returns to
-- 'submitted', declining just clears it.
alter table public.guest_responses add column pending_change jsonb;
alter table public.guest_responses drop constraint guest_responses_state_check;
alter table public.guest_responses add constraint guest_responses_state_check
  check (state in ('not_responded', 'draft', 'submitted', 'change_requested'));

-- Host-facing view of what's waiting on them — same "look through the
-- guest to the event owner" idiom as guest_responses_select itself.
create index guest_responses_pending_change_idx on public.guest_responses (guest_id)
  where state = 'change_requested';
