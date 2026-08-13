-- Flagship demo suppliers, ported from stitchd-v9.jsx's SUPPLIERS_SEED (the
-- reference prototype) rather than invented — real per docs/decisions.md's
-- "bringing the prototype to life" framing, pending real supplier sign-ups.
-- "price" in the prototype is thousands of ZAR; converted to integer cents.
-- verified = true for suppliers the prototype marked "confirmed"/"core".

insert into public.suppliers (category, name, headline, phone, rating, review_count, price_from_cents, verified, status)
values
  ('Planner', 'VIP Hosting', 'Lungi Dlodlo · Lead Planner', '+27821230001', 4.9, 128, 3500000, true, 'active'),
  ('Venue', 'Oakfield Farm', 'Premium venue · Muldersdrift', '+27821230002', 4.8, 96, 12800000, true, 'active'),
  ('Photography', 'Memories by TK', 'Photo & video · Sandton', '+27821230003', 4.9, 201, 2800000, true, 'active'),
  ('Catering', 'Taste Affair', 'Plated · 140 pax', '+27821230004', 4.7, 80, 6500000, true, 'active'),
  ('Entertainment', 'Vibe Creators', 'DJ & sound · Soweto', '+27821230006', 4.8, 156, 1500000, true, 'active'),
  ('Videography', 'Reel Love Films', 'Highlight film · Rosebank', '+27821230007', 4.6, 67, 2800000, false, 'active'),
  ('Cake', 'Sugar & Spice', '3-tier + dessert table', '+27821230008', 4.9, 210, 950000, false, 'active'),
  ('MC', 'MC Bongani Live', 'Master of ceremonies', '+27821230009', 4.8, 65, 600000, false, 'active'),
  ('Hair & Makeup', 'Glam Squad by Zanele', 'Bride + 4 maids', '+27821230010', 4.7, 68, 900000, false, 'active'),
  ('Transport', 'VIP Chauffeurs', 'Couple car + guest shuttle', '+27821230011', 4.8, 40, 1200000, false, 'active'),
  ('Tent & Weather', 'Shade & Shine Marquees', 'Weather backup · 160 pax', '+27821230013', 4.8, 54, 1850000, false, 'active'),
  ('Tailor', 'Stitch & Cut Atelier', 'Groom + groomsmen suiting', '+27821230014', 4.8, 58, 1600000, false, 'active'),
  ('Flower Specialist', 'Bloom Room', 'Floral designer · Bryanston', '+27821230005', 4.9, 74, 2200000, true, 'active'),
  ('Décor Supplier', 'Décor Elegance', 'Draping, tables, lighting', '+27821230012', 4.6, 47, 1200000, false, 'active')
on conflict (name) do nothing;
