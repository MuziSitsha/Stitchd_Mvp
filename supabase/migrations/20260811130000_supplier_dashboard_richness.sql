-- Several small, related additions so the real Supplier Portal can match
-- what the prototype's own mock "portal" lens shows (stitchd-v9.jsx lines
-- 2303-2448) using real data instead of SUP_STATS' fake numbers, plus a
-- genuine multi-category fix (most catering companies also do bar/coffee
-- service — a single `category` text column can't represent that).

-- ---------------------------------------------------------------------------
-- 1) Multi-category. suppliers.category stays as the "primary" category
--    (unchanged, so every existing query/view that reads it directly still
--    works) — this table is the *complete* list, including the primary one,
--    and is what ranking/search should actually join against so a supplier
--    with two categories competes — and can be found — in both.
-- ---------------------------------------------------------------------------
create table public.supplier_categories (
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  category text not null,
  primary key (supplier_id, category)
);

insert into public.supplier_categories (supplier_id, category)
select id, category from public.suppliers;

alter table public.supplier_categories enable row level security;

create policy supplier_categories_select_all on public.supplier_categories for select
  using (true);

-- Same tier as claiming/creating a listing itself (plain CRUD on your own
-- row, no side effects) — a supplier manages their own category list
-- directly, no Edge Function needed.
create policy supplier_categories_manage_own on public.supplier_categories for all to authenticated
  using (supplier_id in (select id from public.suppliers where profile_id = auth.uid()))
  with check (supplier_id in (select id from public.suppliers where profile_id = auth.uid()));

-- Ranking now joins through supplier_categories instead of using
-- suppliers.category directly, so a supplier in N categories gets N
-- independent rows/ranks — one per category they actually compete in.
-- verified/featured are supplier-level, so they're identical across a
-- given supplier's rows; only rank_in_category varies per category.
drop view if exists public.supplier_ranking;
create view public.supplier_ranking as
select
  s.id, sc.category, s.name, s.rating, s.verified,
  exists (
    select 1 from public.boosts b
    where b.supplier_id = s.id and b.status = 'active' and b.expires_at > now()
  ) as featured,
  row_number() over (
    partition by sc.category
    order by
      exists (select 1 from public.boosts b where b.supplier_id = s.id and b.status = 'active' and b.expires_at > now()) desc,
      s.verified desc,
      s.rating desc nulls last
  ) as rank_in_category
from public.suppliers s
join public.supplier_categories sc on sc.supplier_id = s.id
where s.status = 'active';

-- ---------------------------------------------------------------------------
-- 2) leads.order_id — so a lead spawned from a paid order (see
--    webhooks-paystack) can show its real value and Stitched+ status on the
--    supplier dashboard, instead of that only being visible on the order
--    itself. Nullable: leads from the direct request form have no order.
-- ---------------------------------------------------------------------------
alter table public.leads add column order_id uuid references public.orders (id);

-- ---------------------------------------------------------------------------
-- 3) Package add-ons — a real version of the prototype's HIRE[].addons
--    (which is prototype-local mock data, not tied to any real supplier).
--    Plain CRUD on your own row, same tier as supplier_categories above.
-- ---------------------------------------------------------------------------
create table public.supplier_addons (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  label text not null,
  price_cents int not null,
  created_at timestamptz not null default now()
);

alter table public.supplier_addons enable row level security;

create policy supplier_addons_select_all on public.supplier_addons for select
  using (true);

create policy supplier_addons_manage_own on public.supplier_addons for all to authenticated
  using (supplier_id in (select id from public.suppliers where profile_id = auth.uid()))
  with check (supplier_id in (select id from public.suppliers where profile_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 4) Verification as a request, not a self-toggle. The prototype's mock
--    lets a supplier flip their own "Verified" switch (fine for a demo with
--    no real trust model) — the real system already has FR-SUP-04 "request"
--    + FR-ADMIN-02 "admin verifies" as two separate steps, and
--    verifications-toggle already enforces the admin side. This adds the
--    missing supplier-side half: insert your own PENDING request only —
--    the `status = 'pending'` check means this can never be used to
--    self-approve.
-- ---------------------------------------------------------------------------
create policy verifications_insert_own_pending on public.verifications for insert to authenticated
  with check (
    status = 'pending'
    and supplier_id in (select id from public.suppliers where profile_id = auth.uid())
  );
