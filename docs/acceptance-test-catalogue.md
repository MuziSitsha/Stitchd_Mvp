# STITCHD — L1–L3 Acceptance Test Catalogue

Traceability from the v3.1 Product and Service Specification (Part L: "the
test catalogue and the gates") to the automated suite in
`apps/web/tests/` and `apps/web/src/lib/*.test.ts`.

- **Runner:** vitest, `apps/web/vitest.config.ts` — `environment: node`,
  `fileParallelism: false`, `testTimeout: 15_000` (journey steps 3–5 raised
  to 30s). `tests/global-setup.ts` pauses the pg_cron jobs for the run;
  `tests/setup.ts` polyfills `WebSocket` for supabase-js realtime on Node 20.
- **Target:** the real local Supabase stack (Postgres 17 + GoTrue + Storage
  + Deno Edge runtime) via Docker. Not mocks — every L2/L3 test exercises
  the actual RLS policies, triggers, RPCs, Edge Functions and auth hooks.
- **Count as of this revision:** 151 test cases across 18 files, all green.
  Every run is verified to leave zero residue in the operational tables
  (`events`, `auth.users`, `rate_limit_hits`, `notification_queue`,
  `auth_failed_logins`, `households`, `tickets`, …). `activity_log` is an
  append-only audit trail; the two newest files sweep their own audit rows,
  the older files leave orphan audit rows that reference nothing (noted, not
  a residue defect).

## Tiers

| Tier | Meaning | Where |
|---|---|---|
| **L1** | Pure logic — no I/O. Formatting, band maths, the business-hours calendar. | `src/lib/pricing.test.ts`; `business-hours-clocks.test.ts` (helper cases); `readiness-obligations.test.ts` (band-boundary cases) |
| **L2** | One capability against the real stack — an RLS policy, a trigger, an RPC, an Edge Function, an auth hook. Includes the "isolation attacker" RLS-proof pattern the spec calls for in Part L3. | all `tests/rls/*.test.ts` except `journey-01` |
| **L3** | A whole business journey across many capabilities, plus cross-account visibility checked at every stage it could leak. | `journey-01.test.ts` (**T-JOURNEY-01**), and the isolation-attacker halves of every L2 file |

## Spec named tests

The spec names three tests explicitly. All three are covered:

| Spec ID | Spec intent | This suite |
|---|---|---|
| **T-AUTH-02** | The "isolation attacker" RLS proof — two events, two suppliers, revoked roles, forged IDs, direct REST, no cross-tenant read or write. | `isolation-attacker.test.ts` (11 cases) + the isolation half of `events-budget-isolation`, `functions-bookings-membership`, `rsvp-core`, `readiness-obligations`, `refund-ceiling`, `ticket-clocks-rescue`, and every stage of `journey-01`. |
| **T-PAY-04** | Refund ceiling and single-admin vs two-admin separation below/above R10,000. | `refund-ceiling.test.ts` (9 cases). |
| **T-JOURNEY-01** | request → quote → booking → mixed RSVP → headcount change approval → fee payment → reconfirmation → no-show ticket → authorised Rescue → completion → reconciliation, with all visibility and audit evidence. "The spine of Gate G1." | `journey-01.test.ts` (10 ordered steps). |

---

## Coverage by spec Part

### Part B2 — Actor model, membership, delegation, atomic owner transfer

| ID | Test | File | Tier |
|---|---|---|---|
| T-MEMBER-01 | Owner can see and create functions on their own event | functions-bookings-membership | L2 |
| T-MEMBER-02 | Unrelated user cannot see or create functions on another event | functions-bookings-membership | L2/L3 |
| T-MEMBER-03 | Owner sees their own seeded membership row | functions-bookings-membership | L2 |
| T-MEMBER-04 | Unrelated user cannot see another event's membership rows | functions-bookings-membership | L3 |
| T-MEMBER-05 | `event_members` has no client-facing insert/update — changes only via `transfer_event_ownership` | functions-bookings-membership | L2 |
| T-MEMBER-06 | Non-owner cannot transfer ownership of someone else's event | functions-bookings-membership | L2/L3 |
| T-MEMBER-07 | Real owner transfers ownership; invariants hold — exactly one active owner, old grant revoked, `events.owner_id` updated | functions-bookings-membership | L2 |

Gap: partner / Event-Lead grants with **expiring spend ceilings** exist in
the schema (`event_members.spend_ceiling_cents`, `expires_at`) but there is
no automated test that a ceiling is enforced on spend or that an expired
grant stops working — no spend path reads them yet. Tracked.

### Part C1 — Launch gate, public landing, contact-interest form

| ID | Test | File | Tier |
|---|---|---|---|
| T-LAUNCH-01 | `platform_settings` is world-readable (landing page, unauthenticated) | launch-flag | L2 |
| T-LAUNCH-02 | A plain authenticated user cannot flip the launch flag | launch-flag | L2/L3 |
| T-LAUNCH-03 | An admin can flip the launch flag | launch-flag | L2 |
| T-LAUNCH-04 | A raw `supabase.auth.signUp()` is rejected while `signup_open` is false (server-enforced via `before_user_created_hook`) | launch-flag | L2 |
| T-LAUNCH-05 | The same signup succeeds once an admin opens the gate | launch-flag | L2 |
| T-LAUNCH-06 | Staff-provisioned `admin.createUser` is never gated by the hook | launch-flag | L2 |
| T-CONTACT-01 | Contact form refused while the Product Owner switch is off — including a direct API call | contact-interest | L2 |
| T-CONTACT-02 | Once enabled, a submission records exactly one row and creates **no** supplier, lead, account or onboarding message | contact-interest | L2/L3 |
| T-CONTACT-03 | `kind` and `email` validation | contact-interest | L2 |
| T-CONTACT-04 | 5-per-hour-per-email rate limit (Part K1 shape) | contact-interest | L2 |
| T-CONTACT-05 | Only admin/super can read submissions and mark them handled | contact-interest | L2/L3 |

### Part F — RSVP: import, guest loop, cutoff, changes, reminders

| ID | Test | File | Tier |
|---|---|---|---|
| T-RSVP-01 | Import a household + guest, entitled to a real function | rsvp-core | L2 |
| T-RSVP-02 | Retried identical import (same fingerprint) is a safe no-op | rsvp-core | L2 |
| T-RSVP-03 | Non-owner cannot import into another event | rsvp-core | L2/L3 |
| T-RSVP-04 | Forged `function_id` from another event is rejected | rsvp-core | L2/L3 |
| T-RSVP-05 | Host can see their own household + guest | rsvp-core | L2 |
| T-RSVP-06 | Unrelated user cannot see the household, guests or responses | rsvp-core | L3 |
| T-RSVP-07 | `invitations` / `guest_sessions` have zero client-facing policy | rsvp-core | L2 |
| T-RSVP-08 | Host publishes an invitation and gets a raw token (once) | rsvp-core | L2 |
| T-RSVP-09 | A garbage token gets a generic non-enumerating error | rsvp-core | L2 |
| T-RSVP-10 | A real token exchanges for a session + the household's guests | rsvp-core | L2 |
| T-RSVP-11 | An attending response with a meal choice records + returns a live count | rsvp-core | L2 |
| T-RSVP-12 | A stale `expected_revision` is a conflict, never a silent overwrite | rsvp-core | L2 |
| T-RSVP-13 | A declined answer never stores a meal, even if the client sends one | rsvp-core | L2 |
| T-RSVP-14 | A forged `guest_id` outside the household is rejected | rsvp-core | L2/L3 |
| T-RSVP-15 | Re-publishing bumps the version and invalidates the old session on its next write | rsvp-core | L2 |
| T-RSVP-16 | After cutoff, a guest edit parks as `change_requested`; the counted answer is untouched | rsvp-cutoff | L2 |
| T-RSVP-17 | Host declining the change discards it and restores `submitted` | rsvp-cutoff | L2 |
| T-RSVP-18 | Host approving applies the pending answer and bumps the revision | rsvp-cutoff | L2 |
| T-RSVP-19 | An unrelated user cannot approve a change on someone else's event | rsvp-cutoff | L2/L3 |
| T-RSVP-20 | 7-day reminder enqueued to the host with the right vars + recipient, for a function 5 days out with an unanswered household | rsvp-reminders | L2 |
| T-RSVP-21 | Reminder scan is idempotent — no duplicate on a second run | rsvp-reminders | L2 |
| T-RSVP-22 | Inside 2 days, the 2-day nudge fires (not the 7-day one) | rsvp-reminders | L2 |
| T-RSVP-23 | No reminder when every household has replied | rsvp-reminders | L2 |
| T-RSVP-24 | Window edges — cutoff >7 days out, in the past, or unset — produce nothing | rsvp-reminders | L2 |
| T-RSVP-25 | Households with an unpublished invitation aren't counted | rsvp-reminders | L2 |

### Part G1 — Explainable readiness scoring

| ID | Test | File | Tier |
|---|---|---|---|
| T-READY-01 | New booking auto-seeds exactly the 6 obligations, weights sum to 100 | readiness-obligations | L2 |
| T-READY-02 | Owner can see and update their own booking's obligations | readiness-obligations | L2 |
| T-READY-03 | Unrelated user cannot see or touch them | readiness-obligations | L2/L3 |
| T-READY-04 | Zero satisfied → score 0, band red | readiness-obligations | L1/L2 |
| T-READY-05 | 55/100 → still red (<60) | readiness-obligations | L1/L2 |
| T-READY-06 | 70/100 → amber (60–84) | readiness-obligations | L1/L2 |
| T-READY-07 | 100 with no overdue, no blocker → green | readiness-obligations | L1/L2 |
| T-READY-08 | Marking an obligation not-applicable removes it from the denominator (85/85 → 100, not 85/100) | readiness-obligations | L1/L2 |
| T-READY-09 | A future-due unsatisfied obligation is still a real gap in the score while the band stays green | readiness-obligations | L2 |
| T-READY-10 | That obligation going actually overdue caps the band at amber even at score 90 | readiness-obligations | L2 |
| T-READY-11 | A declined `supplier_ticket` forces red regardless of a perfect score | readiness-obligations | L2 |
| T-READY-12 | Zero applicable obligations → score null, band grey, never 100% | readiness-obligations | L1/L2 |
| T-READY-13 | `booking_readiness` is security-invoker — an unrelated user can't compute it for a booking they don't own | readiness-obligations | L2/L3 |
| T-READY-14 | `event_readiness` rollup reflects the real booking's band + full coverage | readiness-obligations | L2 |

### Part H2 — Ticket clocks, escalation, Rescue

| ID | Test | File | Tier |
|---|---|---|---|
| T-CLOCK-01 | P0/critical: 5 / 10 / 15 wall-clock minutes | ticket-clocks-rescue | L2 |
| T-CLOCK-02 | P1/high: 15 / 30 / 60 wall-clock minutes | ticket-clocks-rescue | L2 |
| T-CLOCK-03 | P2/P3 clocks run in business hours, not wall clock | ticket-clocks-rescue | L2 |
| T-CLOCK-04 | Escalating priority recomputes from the ORIGINAL `created_at`, never `now()` — no reset to hide a breach | ticket-clocks-rescue | L2 |
| T-CLOCK-05 | A breached first-response clock escalates the ticket and enqueues `ticket_escalated` | ticket-clocks-rescue | L2 |
| T-CLOCK-06 | A ticket with no breached clock is left alone | ticket-clocks-rescue | L2 |
| T-CLOCK-07 | A resolved ticket is never escalated even with a breached clock | ticket-clocks-rescue | L2 |
| T-CLOCK-08 | `business_hours_add` — advance within a working day | business-hours-clocks | L1 |
| T-CLOCK-09 | Friday-afternoon start rolls across the weekend | business-hours-clocks | L1 |
| T-CLOCK-10 | A weekend start begins from Monday 08:00 | business-hours-clocks | L1 |
| T-CLOCK-11 | A full business day (540 min) = 08:00 → 17:00 | business-hours-clocks | L1 |
| T-CLOCK-12 | A before-hours start clamps to the window open | business-hours-clocks | L1 |
| T-CLOCK-13 | 0 / negative minutes return the input unchanged | business-hours-clocks | L1 |
| T-CLOCK-14 | P2 raised Friday 16:00 → first response Monday, not the weekend | business-hours-clocks | L2 |
| T-CLOCK-15 | P3 raised Friday 16:00 → one-business-day first response | business-hours-clocks | L2 |
| T-CLOCK-16 | P0 raised Friday 16:00 stays on wall-clock minutes | business-hours-clocks | L2 |
| T-CLOCK-17 | P1 raised Friday 16:00 stays on wall-clock minutes | business-hours-clocks | L2 |
| T-RESCUE-01 | The event owner can propose a rescue candidate | ticket-clocks-rescue | L2 |
| T-RESCUE-02 | An unrelated user cannot propose a rescue for someone else's ticket | ticket-clocks-rescue | L2/L3 |
| T-RESCUE-03 | Admin can approve a request the owner proposed; the owner cannot approve their own | ticket-clocks-rescue | L2 |
| T-RESCUE-04 | A decision, once made, cannot be made again (no double-approval race) | ticket-clocks-rescue | L2 |
| T-RESCUE-05 | An unrelated user cannot see this event's rescue requests | ticket-clocks-rescue | L2/L3 |

### Part I1 — Notification reliability (queue, lease, retry, dead-letter)

| ID | Test | File | Tier |
|---|---|---|---|
| T-QUEUE-01 | A queued row is claimed; a concurrent claim never gets the same row | notification-queue | L2 |
| T-QUEUE-02 | Reporting `sent` marks the row sent | notification-queue | L2 |
| T-QUEUE-03 | Reporting `failed` schedules a real future retry and records the error | notification-queue | L2 |
| T-QUEUE-04 | `max_attempts` failures dead-letter the row as `unknown` | notification-queue | L2 |
| T-QUEUE-05 | `intent_key` uniqueness makes a re-enqueue a harmless no-op | notification-queue | L2 |
| T-QUEUE-06 | A crashed run's stale lease becomes claimable again | notification-queue | L2 |
| T-QUEUE-07 | Admin can see queue rows; a plain user cannot | notification-queue | L2/L3 |
| T-QUEUE-08 | No authenticated user — not even admin — can insert directly | notification-queue | L2 |
| T-QUEUE-09 | The processor runs a real `notify()` and marks a no-phone row `suppressed`, not retried forever | notification-queue | L2 |
| T-QUEUE-10 | A non-admin cannot invoke the processor | notification-queue | L2 |
| T-CRON-01 | Both minute jobs are registered (the pause fn only works if the rows exist) | scheduled-jobs | L2 |
| T-CRON-02 | `drain_notification_queue` is service-role-callable and returns void | scheduled-jobs | L2 |
| T-CRON-03 | `tickets_escalate` is service-role-callable and returns a result set | scheduled-jobs | L2 |

### Part J1 — Functions, bookings, one-booking-per-accepted-quote-version

| ID | Test | File | Tier |
|---|---|---|---|
| T-BOOK-01 | Accepting a quote via the real `quotes-respond` Edge Function creates exactly one booking | functions-bookings-membership | L2/L3 |
| (see also T-JOURNEY-01 step 2 — booking + 6 obligations seeded) | | journey-01 | L3 |

### Part K1 — Anti-abuse rate limits

| ID | Test | File | Tier |
|---|---|---|---|
| T-RATE-01 | `check_rate_limit` allows up to `max_count`, then blocks the next in the window | rate-limits | L2 |
| T-RATE-02 | A different key in the same bucket has its own budget | rate-limits | L2 |
| T-RATE-03 | Hits outside the window don't count | rate-limits | L2 |
| T-RATE-04 | The 21st lead-create from the same number in the window → 429 | rate-limits | L2 |
| T-RATE-05 | The 6th distinct guest-import for the same event in the window → 429 | rate-limits | L2 |
| T-AUTH-10 | 5 failed sign-ins lock the account — the correct password is then refused | login-lockout | L2 |
| T-AUTH-11 | 4 failures don't lock; a success clears the counter | login-lockout | L2 |
| T-AUTH-12 | The lockout is per account — a bystander signs in fine | login-lockout | L2/L3 |
| T-AUTH-13 | The 15-minute window slides — aged failures unlock the account | login-lockout | L2 |

### Part K2 / Column-guard — privileged-column protection

| ID | Test | File | Tier |
|---|---|---|---|
| T-ISO-01 | An attacking supplier cannot self-approve out of `pending` | isolation-attacker | L2/L3 |
| T-ISO-02 | …cannot set `verified = true` on itself | isolation-attacker | L2/L3 |
| T-ISO-03 | Positive control: a supplier CAN pause/reactivate their own active listing | isolation-attacker | L2 |
| T-ISO-04 | …cannot touch a different supplier's row at all | isolation-attacker | L2/L3 |
| T-ISO-05 | Real client + real supplier can both see the real quote | isolation-attacker | L2 |
| T-ISO-06 | Neither isolation attacker can see the real quote | isolation-attacker | L3 |
| T-ISO-07 | `quote_versions` / `quote_items` look through to the parent quote's visibility | isolation-attacker | L2 |
| T-ISO-08 | No authenticated client can insert a quote directly — `quotes-create` is the only path | isolation-attacker | L2 |
| T-ISO-09 | Real client sees their own ticket; the isolation attacker doesn't | isolation-attacker | L3 |
| T-ISO-10 | A client cannot create a ticket against an event they don't own (forged `event_id`) | isolation-attacker | L2/L3 |
| T-ISO-11 | A supplier cannot create a ticket impersonating a different supplier (forged `supplier_id`) | isolation-attacker | L2/L3 |

### Part E / budget — events + budget-payment isolation

| ID | Test | File | Tier |
|---|---|---|---|
| T-EVENT-01 | Owner can read their own event | events-budget-isolation | L2 |
| T-EVENT-02 | A different authenticated user cannot read another owner's event | events-budget-isolation | L2/L3 |
| T-EVENT-03 | An anon client cannot read any event | events-budget-isolation | L2 |
| T-EVENT-04 | Cannot forge ownership on insert (`owner_id` = someone else's) | events-budget-isolation | L2 |
| T-EVENT-05 | Cannot update another owner's event | events-budget-isolation | L2/L3 |
| T-EVENT-06 | A client cannot forge a paid `budget_payments` row via direct REST | events-budget-isolation | L2/L3 |
| T-EVENT-07 | The owning client sees a real payment; a different client does not | events-budget-isolation | L2/L3 |

### Supplier onboarding pricing (Part D / catalog)

| ID | Test | File | Tier |
|---|---|---|---|
| T-PRICE-01..08 | `pricePreview` — flat/per-head/per-hour/per-day/quote-only formatting, em-dash for zero/blank/invalid, whole-rand rounding, negative rejected | pricing | L1 |
| T-PRICE-09..12 | `priceLabel` — quote-only ignores cents, null → null not a placeholder, unit phrasing matches `pricePreview`, agreement unit-by-unit | pricing | L1 |

### Part L3 — T-JOURNEY-01 (the Gate G1 spine)

| Step | Assertion | Tier |
|---|---|---|
| 1 | request: client A asks suppliers A + B; supplier C and client B see neither | L3 |
| 2 | quote + booking: both suppliers quote, client A accepts both; one booking, 6 obligations seeded; supplier C's forged quote → 403; client B can't see the booking | L3 |
| 3 | guest import: 3 households / 5 guests / 1 permitted plus-one; client B sees none of it | L3 |
| 4 | mixed RSVP: per-function answers, some attending, one declined; declined never stores a meal | L3 |
| 5 | headcount change approval: after cutoff, a guest edit parks; the counted answer + host headcount don't move until the host approves; client B can't approve | L3 |
| 6 | fee payment: recorded on event A, visible to client A, not to client B | L3 |
| 7 | reconfirmation: obligations satisfied drives booking readiness to green (100) | L3 |
| 8 | no-show ticket: a P0 breaches its created_at-anchored first-response clock; escalation enqueues exactly one `ticket_escalated` to the owner; supplier B can't see the ticket | L3 |
| 9 | authorised Rescue: ops1 proposes, cannot self-approve; ops2 (a different admin) can | L3 |
| 10 | completion + reconciliation: booking A completes; `activity_log` carries the run; the isolation attackers still see nothing at the end | L3 |

---

## Known gaps and documented deviations

These are **not** covered — each is a conscious limitation recorded here
rather than pretended away.

| Area | Limitation | Rationale / where documented |
|---|---|---|
| Ticket clocks | No public-holiday calendar — `business_hours_add` only skips weekends and non-working hours. | Needs a maintained holiday table; `20260910170000_business_hours_ticket_clocks.sql` header. |
| Ticket clocks | The P2/P3 action-plan clock's pause-in-`waiting_client` behaviour is not implemented (only the non-pausing case). | `20260909160000_ticket_clocks_rescue.sql` header. |
| Login lockout | Per-account only; the "+ IP" half of "5 per 15 min per account + IP" is still GoTrue's own IP limiter's job — the `password_verification_attempt` hook payload carries no client IP. | `20260910180000_login_lockout_hook.sql` header. |
| RSVP writes rate limit | Keyed by `household_id` alone, not `household_id + IP` — reliable forwarded-header handling across every deploy topology isn't attempted. | `20260909180000_rate_limits.sql`; `rsvp-submit-response` header. |
| RSVP reminders | Host-facing only — STITCHD holds no guest contact details, so it cannot nudge guests directly. | `20260910160000_rsvp_reminders.sql` header. |
| Membership | `event_members.spend_ceiling_cents` / `expires_at` are stored but unenforced — no spend path reads them yet. | This document, Part B2 section. |
| Notification delivery | WhatsApp/SMS providers are unconfigured locally, so every queue drain in tests ends `suppressed`. The pipeline (enqueue → lease → render → `message_log`) is fully exercised; the provider leg is `notify()`'s existing "no-op + log when unconfigured" path. | `_shared/notify.ts` header. |
| RSVP session storage | `sessionStorage`, not an HttpOnly cookie — deliberate for the cross-origin SPA + Edge-Functions topology. | `20260909130000_rsvp_core.sql` header. |
| `activity_log` residue | The pre-`journey-01` L2 files leave orphaned audit rows (null `actor_id`, deleted `entity_id`). Harmless — an append-only audit trail — but not swept. | This document, header. |

---

## Gate mapping

**G1 (per Part L3): "T-JOURNEY-01 passes end to end, with all notifications,
visibility and audit evidence verified."**

- T-JOURNEY-01: **green** (10/10 steps).
- Every capability T-JOURNEY-01 leans on has its own L2 isolation proof
  above, so a green journey is not hiding a broken policy underneath.
- Notification evidence: steps 8–9 assert the real `notification_queue`
  row; `T-QUEUE-09` + the live verification in the RSVP-reminders and
  scheduled-jobs work confirm the drain path renders and writes
  `message_log`.
- Visibility evidence: every step re-checks that the isolation attackers
  (client B / supplier C) see nothing.
- Audit evidence: step 10 asserts `activity_log` rows for the accepted
  quote and the ticket path.

**Outstanding before a clean G1 sign-off** (product/ops calls, not code):
fee & refund terms, the support roster and coverage hours, the Clickatell
owner/cost/SLA line, and the retention / EU-data-residency confirmations —
all tracked in `docs/decisions.md` §3 "Still open".
