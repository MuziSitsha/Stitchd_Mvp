# supabase/

Backend for the STITCHD rewrite — see `docs/decisions.md` for why this
replaces `apps/api` (frozen; a rename to `apps/api-legacy` is planned but
not yet done — see `docs/decisions.md`).

- `migrations/` — schema + RLS policies + the `activity_log` outbox trigger + `ST-*` ref sequences. Starts filling in Phase 1 (Identity & Access).
- `functions/` — Deno Edge Functions implementing the `/api/v1/*` write layer from `STITCHD-SRS-SDS.md` §13.3, one folder per endpoint cluster (`orders/`, `webhooks-paystack/`, `leads/`, `change-requests/`, etc.). `_shared/` holds the `PaymentProvider`/`MessageProvider` adapters, JWT verification, and activity-log helpers used across functions.
- `seed.sql` — the flagship demo dataset (Junior & Nadine Chaka + Joburg suppliers), loaded at Phase 9 cutover.

Local dev:

```
npx supabase start      # local Postgres + Studio + Auth + Realtime
npx supabase functions serve
```
