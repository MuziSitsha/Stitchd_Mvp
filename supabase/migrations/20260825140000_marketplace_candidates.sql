-- Suppliers > Find someone real discovery: alternative candidates for each
-- currently-pending wedding-squad role (see CANDIDATE_SEED in apps/web's
-- data.ts for the full rationale — one alternative per pending role, not a
-- second supplier cast). Seeded as real rows in the same `suppliers` table
-- the wedding-squad and Stitch It suppliers already live in, so booking one
-- through Marketplace.tsx can raise a genuine supplier_tickets row via the
-- existing supplier-tickets-create function, exactly like confirming any
-- other pending supplier already does.
insert into public.suppliers (name, category, status, rating, review_count, price_from_cents, verified)
values
  ('Frame & Story', 'Videography', 'active', 4.7, 89, 2400000, false),
  ('Cocoa & Co', 'Cake', 'active', 4.8, 132, 800000, true),
  ('Thabo Live', 'MC', 'active', 4.9, 41, 700000, false),
  ('Studio Nala', 'Hair & Makeup', 'active', 4.9, 95, 1100000, false),
  ('Sandton Fleet Cars', 'Transport', 'active', 4.6, 52, 1000000, false),
  ('Cover & Co Marquees', 'Tent & Weather', 'active', 4.9, 88, 2100000, true),
  ('Modern Fit Menswear', 'Tailor', 'active', 4.7, 63, 1400000, false),
  ('Bloom & Drape Co', 'Décor Supplier', 'active', 4.8, 59, 1350000, false)
on conflict (name) do nothing;
