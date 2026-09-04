-- Real supplier<->customer messaging on Stitch It's on-demand leads. Unlike
-- supplier_tickets (Phase 1), the customer here is frequently anonymous —
-- a checkout with a phone number, no account, nothing to log back into — so
-- this can't use ticket_messages' "RLS scoped to auth.uid()" idiom at all.
--
-- access_token is the "key" a customer's magic link carries: whoever holds
-- it can read/write that one lead's thread, no login required. lead_messages
-- itself gets RLS enabled but zero select/insert policies for
-- authenticated/anon — a deliberate deny-all. Every read/write goes through
-- the lead-messages Edge Function, which does its own authorization (JWT for
-- the claimed supplier, token match for the customer) with the service role,
-- same "service role does the real check" idiom as supplier-tickets-confirm.
alter table public.leads add column access_token uuid not null default gen_random_uuid();

create table public.lead_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  sender_role text not null check (sender_role in ('customer', 'supplier')),
  sender_id uuid references auth.users (id),
  body text not null,
  created_at timestamptz not null default now()
);

create index lead_messages_lead_idx on public.lead_messages (lead_id, created_at);

alter table public.lead_messages enable row level security;

alter publication supabase_realtime add table public.lead_messages;
