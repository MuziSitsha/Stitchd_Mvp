-- Stitched+ real recurring billing (STITCHD-SRS-SDS.md §2.1/§9/§8.6) —
-- closes the audit gap where "Stitched+" was a client-side boolean that
-- faked the discount preview. This table is the durable record a Paystack
-- subscription webhook writes to; the client reads it live instead of
-- toggling local state.
create table public.subscribers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id),
  status text not null default 'pending' check (status in ('pending', 'active', 'cancelled')),
  paystack_customer_code text,
  paystack_subscription_code text,
  plan_code text,
  started_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index subscribers_user_idx on public.subscribers (user_id);

create trigger subscribers_audit after insert or update on public.subscribers
  for each row execute function public.log_activity();

alter table public.subscribers enable row level security;

create policy subscribers_select_own on public.subscribers for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

alter publication supabase_realtime add table public.subscribers;
