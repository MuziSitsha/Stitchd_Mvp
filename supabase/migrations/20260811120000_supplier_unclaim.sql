-- A supplier who claimed the wrong listing had no way back: the update
-- policy's WITH CHECK only allowed the result to be `profile_id = auth.uid()`,
-- so setting it back to null (releasing the claim) always failed — found by
-- the user actually hitting this dead end live, not in review.
--
-- Widening WITH CHECK to also allow a null result stays safe under the same
-- USING clause: a regular supplier can only touch a row that's already
-- theirs or already unclaimed, so the only new thing this permits is
-- "release a row I already own" — never touching anyone else's claim.
drop policy suppliers_update_own on public.suppliers;

create policy suppliers_update_own on public.suppliers for update to authenticated
  using (
    profile_id = auth.uid()
    or profile_id is null
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  )
  with check (
    profile_id = auth.uid()
    or profile_id is null
    or public.has_role(auth.uid(), array['admin', 'super']::public.app_role[])
  );
