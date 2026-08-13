-- Supabase Realtime only broadcasts postgres_changes for tables explicitly
-- added to the supabase_realtime publication — leads was missing this,
-- so the supplier portal's live lead inbox (STITCHD-SRS-SDS.md's Realtime
-- module, §10/§B8) silently never received anything without a manual reload.
alter publication supabase_realtime add table public.leads;
