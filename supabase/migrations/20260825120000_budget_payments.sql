-- Real per-item Paystack checkout for Money > Payments. Budget line items
-- themselves still live client-side in data.ts (BUDGET_ITEMS) — there is no
-- per-event budget-items table yet (see 20260813120000_client_events.sql's
-- own note that guests/budget/tasks migrating to live per-event tables is a
-- separate, larger project). This table is deliberately denormalized
-- (label + amount_cents captured at checkout time) rather than FK'd to a
-- budget item row that doesn't exist in the database, mirroring how orders
-- captures its own line-item snapshot rather than referencing the catalog
-- live.
--
-- Same tier as supplier_tickets/boosts/orders: creation and payment
-- confirmation are side-effecting writes through service-role-backed Edge
-- Functions (budget-payment-checkout / webhooks-paystack), which bypass RLS
-- entirely — no insert/update policy for any role, select-only.
create table public.budget_payments (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.next_ref('BPY'),
  event_id uuid not null references public.events (id) on delete cascade,
  label text not null,
  amount_cents bigint not null check (amount_cents > 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  provider_ref text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index budget_payments_event_idx on public.budget_payments (event_id);

create trigger budget_payments_audit after insert or update on public.budget_payments
  for each row execute function public.log_activity();

alter table public.budget_payments enable row level security;

-- Client sees payments on their own event.
create policy budget_payments_select_client on public.budget_payments for select to authenticated
  using (event_id in (select id from public.events where owner_id = auth.uid()));

-- Admin/super sees everything (cross-account console view).
create policy budget_payments_select_admin on public.budget_payments for select to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

alter publication supabase_realtime add table public.budget_payments;
