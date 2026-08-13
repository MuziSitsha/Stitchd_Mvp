-- Supplier Pilot Week: Catalog (suppliers) + Leads + Boosts + Verifications.
-- Scoped deliberately narrow (STITCHD-SRS-SDS.md FR-SUP-01..05, FR-RANK-01):
-- a supplier can list, receive a real lead, accept/decline it, buy a real
-- (test-mode) Boost, and get verified — each step ticketed and audited via
-- the Phase 1 spine (activity_log, next_ref, log_activity). Full Quoting/
-- Basket/Order/payment-splitting is out of scope this week; leads come from
-- a direct public request form, not a paid checkout.

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles (id),
  category text not null,
  name text not null unique,
  headline text,
  phone text,
  rating numeric(2, 1),
  review_count int not null default 0,
  price_from_cents int,
  verified boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'active', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.next_ref('LEAD'),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  requester_name text not null,
  requester_phone text not null,
  requester_email text,
  details text,
  status text not null default 'new' check (status in ('new', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.boosts (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.next_ref('BST'),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  amount_cents int not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'expired', 'failed')),
  provider_ref text,
  starts_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verifications (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.next_ref('VER'),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger leads_audit after insert or update on public.leads
  for each row execute function public.log_activity();
create trigger boosts_audit after insert or update on public.boosts
  for each row execute function public.log_activity();
create trigger verifications_audit after insert or update on public.verifications
  for each row execute function public.log_activity();

-- Ranking (STITCHD-SRS-SDS.md FR-RANK-01): featured (active boost) > verified > rating.
create view public.supplier_ranking as
select
  s.id, s.category, s.name, s.rating, s.verified,
  exists (
    select 1 from public.boosts b
    where b.supplier_id = s.id and b.status = 'active' and b.expires_at > now()
  ) as featured,
  row_number() over (
    partition by s.category
    order by
      exists (select 1 from public.boosts b where b.supplier_id = s.id and b.status = 'active' and b.expires_at > now()) desc,
      s.verified desc,
      s.rating desc nulls last
  ) as rank_in_category
from public.suppliers s
where s.status = 'active';

alter table public.suppliers enable row level security;
alter table public.leads enable row level security;
alter table public.boosts enable row level security;
alter table public.verifications enable row level security;

-- Suppliers are a public catalog — the lead-request form and ranking preview
-- need anonymous read access, unlike Phase 1's identity tables.
create policy suppliers_select_all on public.suppliers for select
  using (true);

-- USING allows touching a row that's already theirs OR still unclaimed (the
-- "claim your listing" flow); WITH CHECK then pins the *result* to their own
-- id, so claiming can't be used to reassign someone else's listing.
create policy suppliers_update_own on public.suppliers for update to authenticated
  using (
    profile_id = auth.uid()
    or profile_id is null
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  )
  with check (profile_id = auth.uid() or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

create policy leads_select_own_supplier on public.leads for select to authenticated
  using (
    supplier_id in (select id from public.suppliers where profile_id = auth.uid())
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );

create policy leads_update_own_supplier on public.leads for update to authenticated
  using (supplier_id in (select id from public.suppliers where profile_id = auth.uid()))
  with check (supplier_id in (select id from public.suppliers where profile_id = auth.uid()));

create policy boosts_select_own_supplier on public.boosts for select to authenticated
  using (
    supplier_id in (select id from public.suppliers where profile_id = auth.uid())
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );

create policy verifications_select_own_supplier on public.verifications for select to authenticated
  using (
    supplier_id in (select id from public.suppliers where profile_id = auth.uid())
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );

-- No insert policies for leads/boosts/verifications: lead intake, boost
-- checkout, and verification decisions all have side effects (SMS, Paystack,
-- ranking changes) and go through Edge Functions on the service role, per
-- STITCHD-SRS-SDS.md §13.1's own rule of thumb.
