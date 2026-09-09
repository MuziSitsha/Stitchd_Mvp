-- WBS-06 (Part K1 / T-PAY-04): "Partial, duplicate, self-approved refund
-- -> Ceiling and separation enforced." payments-refund already prevents
-- duplicates (an order's status flips off 'paid' after its one refund, so
-- a second attempt fails the status check) but had no ceiling and no
-- separation at all — a single admin could unilaterally decide and execute
-- any refund, of any size, alone.
--
-- Below the ceiling, the existing one-step flow (already verified live on
-- production, via Admin Console's own ConfirmDialog) is untouched — this
-- is additive, not a rewrite of a working, tested path. Above it, a
-- second, different admin must approve before the money moves.
create table public.large_refund_approvals (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.next_ref('LRA'),
  order_id uuid not null references public.orders (id),
  amount_cents int not null check (amount_cents > 0),
  reason text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  requested_by uuid not null references auth.users (id),
  approved_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- One live request per order at a time — a second large-refund request
-- while one is already pending would just be noise to reconcile by hand.
create unique index large_refund_approvals_one_pending_per_order on public.large_refund_approvals (order_id)
  where status = 'pending';
alter table public.large_refund_approvals enable row level security;

create policy large_refund_approvals_select on public.large_refund_approvals for select to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));
-- No insert/update policy for authenticated — refund-request-large and
-- refund-approve-large are the only doors in, same idiom as every other
-- money-adjacent table in this project.

alter publication supabase_realtime add table public.large_refund_approvals;
