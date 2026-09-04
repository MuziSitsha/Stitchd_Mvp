-- Admin needs a forced-suspend control distinct from the supplier's own
-- self-service active/paused toggle (toggleListingStatus in
-- SupplierPortal.tsx) — a suspension has to actually stick, not be casually
-- undone by the supplier flipping their own listing back on. 'suspended' is
-- a third value only admin can set/clear (via the new suppliers-admin-
-- suspend Edge Function), separate from the supplier-controlled pair.
alter table public.suppliers drop constraint suppliers_status_check;
alter table public.suppliers add constraint suppliers_status_check
  check (status = any (array['pending', 'active', 'paused', 'suspended']));
