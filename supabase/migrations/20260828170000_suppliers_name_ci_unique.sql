-- suppliers.name already has a case-sensitive unique constraint, but the
-- entire client app bridges its local demo roster (SUPPLIERS_SEED, its own
-- unrelated local ids) to this real table purely by matching display name —
-- no shared foreign key exists anywhere client-side (useLiveSupplierStatus,
-- useLiveSupplierTickets, useLiveSupplierAvailability). Two real suppliers
-- differing only by case (e.g. "Sugar & Spice" vs "sugar & spice") would
-- still collide and silently cross-contaminate each other's live status
-- under that name-keyed join. Closing the residual, case-insensitive half of
-- that risk here.
create unique index suppliers_name_ci_unique on public.suppliers (lower(name));
