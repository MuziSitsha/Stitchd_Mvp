-- FR-MKT/FR-BOOK/FR-PAY: the real "quote -> book -> pay -> supplier lead"
-- path (STITCHD-SRS-SDS.md §8.2), narrowed to what Stitch It's on-demand
-- catalog actually needs. leads-create's own comment already flagged this
-- exact gap: "Not the full Quoting/Order pipeline... this is the
-- deliberately narrow Supplier Pilot Week path" — this migration is that
-- pipeline.
--
-- Stitch It's 14 hire items (apps/web's HIRE in data.ts) are a genuinely
-- separate supplier cast from the wedding-squad's 14 (confirmed: zero name
-- overlap), so they're seeded here as real suppliers too, under the same
-- `suppliers` table (one catalog, browsed two ways — squad-for-my-wedding
-- vs. on-demand marketplace — matching the spec's actual Supplier/Listing
-- model) rather than inventing a parallel table. Category values use
-- HIRE_CATS' own labels ("Marquees & Tents" etc.) to keep the two
-- namespaces visually distinct even though they share a table.

insert into public.suppliers (name, category, status, rating, review_count, price_from_cents, verified)
values
  ('Stretch & Shade', 'Marquees & Tents', 'active', 4.7, 212, 350000, false),
  ('Peg & Pole Co.', 'Marquees & Tents', 'active', 4.5, 98, 265000, false),
  ('Seat Yourself', 'Chairs & Tables', 'active', 4.6, 340, 2800, false),
  ('The Table Company', 'Chairs & Tables', 'active', 4.4, 76, 19000, false),
  ('BassLine JHB', 'Sound & DJ', 'active', 4.8, 265, 280000, true),
  ('Braai Brothers', 'Food & Braai', 'active', 4.7, 189, 18500, false),
  ('Bounce Town', 'Jumping Castles', 'active', 4.6, 154, 95000, false),
  ('Tap & Pour', 'Mobile Bar', 'active', 4.8, 121, 420000, true),
  ('Loo Deluxe', 'VIP Loos', 'active', 4.5, 64, 250000, false),
  ('Drape Envy', 'Décor & Draping', 'active', 4.9, 88, 650000, true),
  ('PowerUp Rentals', 'Power & Generators', 'active', 4.6, 143, 180000, false),
  ('Chill Trailer Co.', 'Cold Rooms', 'active', 4.7, 71, 150000, false),
  ('Snap Shack', 'Photo Booth', 'active', 4.8, 176, 320000, true),
  ('Bean Machine', 'Coffee Cart', 'active', 4.9, 203, 290000, false)
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Orders (ST-BKG) + order items
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default public.next_ref('BKG'),
  occasion text,
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  hire_date text,
  subtotal_cents int not null,
  bundle_saving_cents int not null default 0,
  member_saving_cents int not null default 0,
  delivery_cents int not null default 0,
  total_cents int not null,
  status text not null default 'draft' check (status in ('draft', 'pending_payment', 'paid', 'failed')),
  provider_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  supplier_id uuid not null references public.suppliers (id),
  label text not null,
  qty int not null default 1,
  unit_price_cents int not null,
  addon_cents int not null default 0,
  line_total_cents int not null,
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_supplier_idx on public.order_items (supplier_id);

create trigger orders_audit after insert or update on public.orders
  for each row execute function public.log_activity();

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Same tier as leads/boosts/verifications: creation and payment are
-- side-effecting writes and go through service-role-backed Edge Functions,
-- which bypass RLS entirely — no insert/update policy needed for any role.
-- Reads are admin/super only (the customer isn't an authenticated user in
-- this flow at all, matching leads-create's public/anonymous pattern).
create policy orders_select_admin on public.orders for select to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

create policy order_items_select_admin on public.order_items for select to authenticated
  using (public.has_role(auth.uid(), array['admin', 'super']::public.app_role[]));

alter publication supabase_realtime add table public.orders;
