-- Real gap found while writing WBS-01's RLS proof tests, not by clicking:
-- suppliers_update_own's `with check (profile_id = auth.uid() ...)` proves
-- ownership of the *row*, but RLS is row-level, not column-level — nothing
-- stopped a signed-in supplier from PATCHing `status`, `verified`, `rating`
-- or `review_count` on their own row directly via REST, bypassing the
-- admin-approval gate entirely (self-approve out of 'pending', undo an
-- admin 'suspended', fake a verification or rating). The app's own UI never
-- sends those fields outside two specific reversible transitions, so this
-- was invisible to every click-through this session.
--
-- Trigger, not a tighter RLS policy: RLS's WITH CHECK only sees the NEW
-- row, so it can't express "this column may only change from X to Y" — a
-- BEFORE UPDATE trigger can see OLD and NEW together. Deliberately *not*
-- security definer: current_user must reflect the actual connecting role
-- (service_role for every admin Edge Function, authenticated for everyone
-- else), not the function owner.
create function public.suppliers_guard_privileged_columns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  is_privileged boolean;
  status_change_allowed boolean;
begin
  is_privileged := (current_user = 'service_role')
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]);

  if is_privileged then
    return new;
  end if;

  -- Never self-settable, no exceptions: verification and rating are ops/
  -- platform judgments, not something a supplier can assert about itself.
  new.verified := old.verified;
  new.rating := old.rating;
  new.review_count := old.review_count;

  -- status: only the two reversible transitions SupplierPortal.tsx's own
  -- self-service actions actually perform. Everything else — pending to
  -- active (skip review), suspended to active (undo an admin suspension),
  -- declined straight to active (skip re-review) — is silently reverted,
  -- the same failure mode RLS itself uses elsewhere in this project (zero
  -- effect, not a thrown error that helps an attacker enumerate the guard).
  status_change_allowed :=
    new.status = old.status
    or (old.status = 'active' and new.status = 'paused')
    or (old.status = 'paused' and new.status = 'active')
    or (old.status = 'declined' and new.status = 'pending');

  if not status_change_allowed then
    new.status := old.status;
  end if;

  return new;
end;
$$;

create trigger suppliers_guard_privileged_columns
  before update on public.suppliers
  for each row execute function public.suppliers_guard_privileged_columns();
