-- STITCHD-SRS-SDS.md §B17 "Seed / dummy data — the flagship demo": the
-- Supplier Portal lens was correctly showing an honest empty state (zero
-- real leads existed), but the reference build always shows a populated
-- Ops/Operator view — the spec explicitly wants seed data rich enough that
-- "nothing shown in the demo is throwaway". This mirrors stitchd-v9.jsx's
-- own LEADS_SEED content/values exactly (names, occasions, dates, amounts),
-- as real rows instead of a hardcoded mock array — same real leads/orders
-- tables and RLS every other lead already goes through.
do $$
declare
  v_bassline uuid := (select id from suppliers where name = 'BassLine JHB');
  v_stretch uuid := (select id from suppliers where name = 'Stretch & Shade');
  v_tap uuid := (select id from suppliers where name = 'Tap & Pour');
  v_bean uuid := (select id from suppliers where name = 'Bean Machine');

  v_order_id uuid;
  v_subtotal int;
  v_member_saving int;

  -- (supplier_id, client, phone, occasion, hire_date, label, value_cents, is_member, status, age)
  rec record;
begin
  for rec in
    select * from (values
      (v_bassline, 'Kagiso M.', '0711234567', 'Birthday', 'Sat 2 Aug', 'DJ + sound setup', 350000, true, 'new', interval '10 minutes'),
      (v_bassline, 'Naledi D.', '0722345678', 'Corporate', 'Fri 8 Aug', 'DJ + sound setup', 330000, false, 'new', interval '40 minutes'),
      (v_bassline, 'Thabo R.', '0733456789', 'Wedding', 'Sat 16 Aug', 'DJ + sound setup', 380000, true, 'new', interval '2 hours'),
      (v_stretch, 'Junior & Nadine', '0744567890', 'Wedding', 'Sat 14 Nov', 'Marquee hire', 350000, true, 'accepted', interval '1 day'),
      (v_tap, 'Zanele N.', '0755678901', 'Party', 'Sun 3 Aug', 'Mobile bar service', 420000, false, 'new', interval '2 days'),
      (v_bean, 'Palesa N.', '0766789012', 'Corporate', 'Wed 6 Aug', 'Coffee cart service', 290000, true, 'new', interval '3 days')
    ) as t(supplier_id, client, phone, occasion, hire_date, label, value_cents, is_member, status, age)
  loop
    v_member_saving := case when rec.is_member then round(rec.value_cents * 0.12 / 0.88) else 0 end;
    v_subtotal := rec.value_cents + v_member_saving;

    insert into orders (occasion, customer_name, customer_phone, hire_date, subtotal_cents, bundle_saving_cents, member_saving_cents, delivery_cents, total_cents, status, created_at)
    values (rec.occasion, rec.client, rec.phone, rec.hire_date, v_subtotal, 0, v_member_saving, 0, rec.value_cents, 'paid', now() - rec.age)
    returning id into v_order_id;

    insert into order_items (order_id, supplier_id, label, qty, unit_price_cents, addon_cents, line_total_cents, created_at)
    values (v_order_id, rec.supplier_id, rec.label, 1, v_subtotal, 0, v_subtotal, now() - rec.age);

    insert into leads (supplier_id, order_id, requester_name, requester_phone, details, status, created_at)
    values (rec.supplier_id, v_order_id, rec.client, rec.phone, rec.occasion || ' — ' || rec.label, rec.status, now() - rec.age);
  end loop;
end $$;
