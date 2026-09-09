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

## 3. v3.1 Product and Service Specification — decision log

Per the v3.1 spec's Part A3 ("Product Owner — Decision rights — Decision log;
staged acceptance") and Part M3's decision register. Each row below is a
G0/G1-gating call the spec explicitly marks as needing to be recorded, not
assumed.

| Date | Decision | Recorded by | Notes |
|---|---|---|---|
| 2026-09-09 | **R1 scope boundary**: Stitch-It (`orders`/`order_items`/`leads`/`lead_messages`), `boosts`, `promotions`, and `subscribers` are formally admitted into R1 | Product Owner (Merc) | Part A1's "In R1" list didn't mention these, despite all four being real, working, and already live in the client/admin apps. The spec calls leaving this unresolved "the worst option." Resolved in favour of keeping working features live rather than flagging them off before a demo. |
| 2026-09-09 | **Execution sequencing**: WBS-01 (test harness + RLS proof) starts before any other WBS item, including RSVP | Product Owner (Merc) | Matches the spec's own Part M1 sequencing note: "WBS-01 first, without exception... everything built after this point rests on it." |
| 2026-09-09 | **Role model**: move from row-existence-derived roles (`suppliers.profile_id` / `events.owner_id`) to explicit membership is confirmed as necessary, folded into WBS-02 | Engineering, acting on the spec's own Part J1 gap finding | Required before RSVP/Part F's household model and Part B2's delegation invariants (partner access, Event Lead, expiring spend ceilings, atomic owner transfer) can be built correctly on top of it. Not yet implemented — this is WBS-02 scope, recorded here so the call itself is traceable per the spec's own governance model. |

### Still open (not yet decided — do not assume either direction)

- **Paystack vs Peach** — already Paystack in code; the spec's G0 checklist item is asking this be *confirmed* deliberately rather than by default. Treating as confirmed given the code has never used Peach.
- **Clickatell owner/cost/SLA** — flagged by the spec as a new dependency the earlier spec didn't carry. Needs a named owner and a cost line before G1; not blocking WBS-01.
- **Fee and refund terms, support roster/coverage hours, retention policy, EU data residency confirmation against the privacy notice** — all explicitly Product Owner / Data Owner / Operations Lead calls per Part M3, none needed for WBS-01, will surface again at G1.
