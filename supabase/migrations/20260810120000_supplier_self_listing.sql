-- FR-SUP-01 ("Supplier manages listing... edits persist") covers a supplier
-- creating their own listing, not just claiming a pre-seeded one — but
-- suppliers had no insert policy at all, so the claim page's own copy
-- ("...or skip to create a new listing") promised a capability that didn't
-- exist. A plain listing insert has no side effects (no SMS, no money, no
-- ranking change), so per §13.1's rule of thumb this is auto-generated
-- REST + RLS, same tier as the existing claim (suppliers_update_own), not
-- an Edge Function.
create policy suppliers_insert_own on public.suppliers for insert to authenticated
  with check (profile_id = auth.uid());
