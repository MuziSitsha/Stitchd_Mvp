# Architecture decisions — STITCHD rewrite

## 1. Full rewrite to the spec's stack, retiring PayFast and Flutter

`STITCHD-SRS-SDS.md` specifies Supabase + Paystack + WhatsApp Cloud API + a web PWA
client. The prior stack (NestJS + TypeORM/Postgres on AWS RDS, PayFast, a Flutter
app) is retired rather than adapted, per an explicit founder decision. Confirmed
before starting: the app was pre-revenue with no real production data, and the
Flutter app implemented the old pre-pivot home-services model — none of the
current wedding/vendor/coach/payment features were ever built there. Retiring it
cost nothing.

`apps/api` and `apps/admin` are frozen (no new feature work) and kept
deployable as a fallback/demo during the rewrite; both are deleted at final
cutover. The planned rename to `apps/api-legacy`/`apps/admin-legacy` is **not
yet done**: both directories are this session's active working directories
(primary + "additional working directories"), and Windows won't allow
renaming a directory that a running process has open — confirmed via
`git mv`/`Move-Item` failing with "Permission denied"/"item is in use" even
after restarting the VS Code TypeScript server. Do the rename later from a
plain terminal with no editor/session holding these paths open (two commands:
`git mv apps/api apps/api-legacy`, `git mv apps/admin apps/admin-legacy`,
then update the handful of path references listed in the commit that added
this note), or ask Claude to retry it from a future session that isn't
rooted inside these directories.

`apps/mobile` was deleted immediately (tag: `archive/mobile-flutter-final`).

## 2. Custom `/api/v1/*` layer is Supabase Edge Functions, not NestJS

The spec's architecture section literally specifies Supabase Edge Functions
(Deno) for hand-written, side-effect endpoints (checkout, webhooks, boost,
approvals, ticket trace), with PostgREST/pg_graphql handling plain reads.

The existing `apps/api` (NestJS) codebase has real, tested logic for a lot
of adjacent concerns (auth, RBAC-ish guards, a PayFast adapter, a booking-like
`WeddingVendorSelectionEntity` flow) that doesn't literally port to Deno — it's a
different runtime with a different ecosystem and no shared team experience yet.

Given the choice between reusing that logic on Node/NestJS (functionally
equivalent, but diverging from the spec's literal wording) and porting to Edge
Functions per the spec, **the founder chose spec-literal fidelity**: build the
custom API layer as Supabase Edge Functions under `supabase/functions/`, and use
the frozen `apps/api` as reference material for porting logic, not as the runtime.
