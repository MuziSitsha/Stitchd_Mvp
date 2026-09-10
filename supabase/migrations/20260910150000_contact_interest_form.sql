-- Part C1: "A separate non-account contact-interest form is permitted only
-- when the Product Owner explicitly enables it. It must not create supplier
-- profiles or trigger onboarding messages."
--
-- platform_settings.contact_interest_form_enabled (added in
-- 20260910120000) is the explicit enable switch. This migration adds the
-- table the form writes to — and nothing else. There is deliberately no
-- trigger on this table, no FK to suppliers, and no code path from here
-- into onboarding: a row landing here is an expression of interest for a
-- human to follow up, never an account.
create table public.interest_submissions (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.next_ref('INT'),
  kind text not null check (kind in ('supplier', 'couple', 'other')),
  name text not null,
  email text not null,
  phone text,
  org_name text,
  message text,
  handled boolean not null default false,
  handled_by uuid references auth.users (id),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
create index interest_submissions_created_idx on public.interest_submissions (created_at desc);
alter table public.interest_submissions enable row level security;

-- No insert policy for any browser role at all — the interest-submit Edge
-- Function is the only door in (same "service role is the only door"
-- idiom as leads-create / budget_payments). That function also checks the
-- enable flag and rate-limits; RLS just makes sure nothing else can write.
create policy interest_submissions_select_admin on public.interest_submissions for select to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));
create policy interest_submissions_update_admin on public.interest_submissions for update to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]))
  with check (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

alter publication supabase_realtime add table public.interest_submissions;
