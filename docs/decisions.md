# Architecture decisions — STITCHD rewrite

## 1. Full rewrite to the spec's stack, retiring PayFast and Flutter

`STITCHD-SRS-SDS.md` specifies Supabase + Paystack + WhatsApp Cloud API + a web PWA
client. The prior stack (NestJS + TypeORM/Postgres on AWS RDS, PayFast, a Flutter
app) is retired rather than adapted, per an explicit founder decision. Confirmed
before starting: the app was pre-revenue with no real production data, and the
Flutter app implemented the old pre-pivot home-services model — none of the
current wedding/vendor/coach/payment features were ever built there. Retiring it
cost nothing.

`apps/api` and `apps/admin` were frozen (no new feature work), kept
deployable as a fallback/demo during the rewrite, and deleted at final
cutover once `apps/web` was live in production on the hosted Supabase
project. Their Vercel deployments (`stitchd-mvp-api`, `api`) were already
non-functional by the time of cutover — `stitchd-mvp-api.vercel.app` returned
a 500 (`FUNCTION_INVOCATION_FAILED`), and the `api.gubudo.com` custom domain
had no DNS record pointing at it — so nothing live depended on them. Both
Vercel projects were removed; the `gubudo.com` domain registration itself was
left untouched.

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
