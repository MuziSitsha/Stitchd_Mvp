-- webhooks-paystack currently only console.error()s on failure — nothing
-- queryable exists today (confirmed by reading the function). This gives
-- admin the doc's "integration status, webhook failures, retry/dead-letter
-- view" — one row per invocation, success or failure, with the raw payload
-- kept for debugging.
create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paystack',
  event_type text,
  reference text,
  status text not null check (status in ('received', 'processed', 'failed', 'invalid_signature')),
  error_message text,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index webhook_deliveries_created_idx on public.webhook_deliveries (created_at desc);

create trigger webhook_deliveries_audit after insert on public.webhook_deliveries
  for each row execute function public.log_activity();

alter table public.webhook_deliveries enable row level security;

create policy webhook_deliveries_select_admin on public.webhook_deliveries for select to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

alter publication supabase_realtime add table public.webhook_deliveries;
