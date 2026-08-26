-- Supplier tickets could previously only move pending -> confirmed. The
-- client-facing "Confirm"/"Resolve" flow now needs the supplier (or an
-- admin) to be able to say no as well as yes, surfaced back to the couple as
-- "needs attention" rather than silently staying pending forever.
--
-- Reuses the existing confirmed_by/confirmed_role/confirmed_at columns for
-- either outcome (they track "who responded and when", not just "who said
-- yes") rather than adding a parallel set of declined_* columns.
alter table public.supplier_tickets drop constraint supplier_tickets_status_check;
alter table public.supplier_tickets add constraint supplier_tickets_status_check
  check (status in ('pending', 'confirmed', 'declined'));
