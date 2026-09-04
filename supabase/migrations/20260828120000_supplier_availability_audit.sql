-- Two real issues found while auditing cross-interface consistency:
-- 1) supplier_availability.state should have been named `status` — every
--    other status-bearing table in this codebase is (boosts, orders,
--    tickets, quotes, promotions...), and log_activity() specifically reads
--    a `status` column to compute from/to state, so the mismatch meant its
--    trigger would silently no-op on every UPDATE (confirmed: zero
--    activity_log rows despite real block/promo toggles already tested).
-- 2) The client's block/promo/open cycle hard-deletes the row to represent
--    "open", unlike every other table's own convention of flipping status
--    rather than deleting — which also means "open" never gets an audit
--    trail either. Making 'open' a real stored value (default) fixes both:
--    reverting becomes a real UPDATE, and it's consistent with the rest of
--    the schema. A missing row still means "open" for anyone joining
--    against this table without caring about history.
alter table public.supplier_availability rename column state to status;
alter table public.supplier_availability drop constraint supplier_availability_state_check;
alter table public.supplier_availability add constraint supplier_availability_status_check
  check (status in ('open', 'blocked', 'promo'));
alter table public.supplier_availability alter column status set default 'open';

create trigger supplier_availability_audit after insert or update on public.supplier_availability
  for each row execute function public.log_activity();
