-- Phase E: accepting a quote confirms the underlying supplier_ticket, but
-- the CLIENT is the one confirming (not the supplier or admin, the only two
-- values this constraint allowed before) — quotes-respond needs to record
-- that honestly so SupplierDrawer's existing "confirmed by ..." copy stays
-- truthful instead of misattributing a client's acceptance to the supplier.
alter table public.supplier_tickets drop constraint supplier_tickets_confirmed_role_check;
alter table public.supplier_tickets add constraint supplier_tickets_confirmed_role_check
  check (confirmed_role = any (array['supplier', 'admin', 'client']));
