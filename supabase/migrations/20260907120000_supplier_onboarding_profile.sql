-- Supplier self-serve onboarding: a real profile (what they offer, a genuine
-- pricing unit instead of a bare "from R" number, contact/service area) and
-- a real admin-approval gate for brand-new applications instead of going
-- straight to 'active' unreviewed (SupplierClaim.tsx's old create-listing
-- form used to force status: 'active' immediately — the new onboarding
-- wizard leaves it at this column's own 'pending' default instead).
alter table public.suppliers
  add column bio text,
  add column service_area text,
  add column photo_url text,
  add column pricing_unit text not null default 'total'
    check (pricing_unit in ('total', 'per_head', 'per_hour', 'per_day', 'quote_only'));

-- 'declined' is deliberately its own value, not a reuse of 'suspended' (an
-- admin taking down an already-active listing for cause) or 'paused' (the
-- supplier's own reversible choice) — a declined brand-new application must
-- not be self-reactivatable via the supplier's own "make it live" toggle.
alter table public.suppliers drop constraint suppliers_status_check;
alter table public.suppliers add constraint suppliers_status_check
  check (status in ('pending', 'active', 'paused', 'suspended', 'declined'));

-- One claimed listing per account, enforced structurally. Two real
-- double-claim incidents this session (a user's own portal-lookup silently
-- dropping one of two claims via .maybeSingle()) both traced back to this
-- never having been a real constraint — only app-level/script-level hygiene
-- prevented it. Verified no existing double-claims before adding this.
create unique index suppliers_profile_id_unique on public.suppliers (profile_id) where profile_id is not null;
