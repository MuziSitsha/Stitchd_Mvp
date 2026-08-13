-- Same gap as 20260809150000_realtime_leads.sql, found the same way: the
-- client-facing Suppliers/Squad lenses and the new Admin Console both
-- subscribe to postgres_changes on suppliers/boosts to reflect a live
-- Verify or Boost without a refresh, but neither table was ever added to
-- the supabase_realtime publication, so no event was ever actually sent —
-- confirmed by watching a real Verify action land in the database with the
-- browser tab open and nothing on screen updating.
alter publication supabase_realtime add table public.suppliers;
alter publication supabase_realtime add table public.boosts;
