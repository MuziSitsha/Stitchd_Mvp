-- Refunds (STITCHD-SRS-SDS.md §5.5 permission matrix — "Issue refund" is an
-- explicit Admin/Super capability) — closes the audit gap where the
-- dispute/support ticket workflow could reach "resolved" with no path that
-- actually moves money back. Scoped to `orders` (Stitch-It on-demand
-- bookings) — the one table with a real Paystack `provider_ref` to refund
-- against; `boosts`/`budget_payments` aren't dispute-adjacent in practice.
alter table public.orders drop constraint orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('draft', 'pending_payment', 'paid', 'failed', 'refunded'));

create table public.refunds (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.next_ref('RFD'),
  order_id uuid not null references public.orders (id),
  amount_cents int not null,
  reason text not null,
  status text not null check (status in ('processed', 'failed')),
  paystack_refund_id text,
  actor_id uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);
create index refunds_order_idx on public.refunds (order_id);

create trigger refunds_audit after insert on public.refunds
  for each row execute function public.log_activity();

alter table public.refunds enable row level security;

create policy refunds_select_admin on public.refunds for select to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

alter publication supabase_realtime add table public.refunds;
