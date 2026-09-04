-- Notifications module (STITCHD-SRS-SDS.md §11) — closes the "silent"
-- complaint from the cross-interface audit: sendSms (_shared/clickatell.ts)
-- already sends real SMS when configured and no-ops to console.log when not,
-- but a console.log inside an Edge Function is invisible to anyone but
-- someone tailing logs. This table gives every send attempt — WhatsApp or
-- SMS, real or logged-only — a queryable, admin-visible row, keyed to the
-- same ST-* ref convention as everything else so it traces alongside its
-- ticket/quote/order in the Transaction Inspector.
create table public.message_log (
  id uuid primary key default gen_random_uuid(),
  ref text not null,
  channel text not null check (channel in ('whatsapp', 'sms')),
  template text not null,
  to_phone text,
  to_user_id uuid references auth.users (id),
  status text not null check (status in ('sent', 'logged', 'failed')),
  provider text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index message_log_ref_idx on public.message_log (ref);

alter table public.message_log enable row level security;

-- Ops-visibility only — same idiom as activity_log/webhook_deliveries: no
-- client-facing insert policy, writes go through service-role Edge Functions.
create policy message_log_select_admin on public.message_log for select to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

alter publication supabase_realtime add table public.message_log;
