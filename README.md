STITCHD

South Africa's premium wedding planning and coordination platform — Johannesburg-first MVP

> **Status:** rebuilt end-to-end against `STITCHD-SRS-SDS.md` on Supabase +
> Paystack + WhatsApp + a web PWA at `apps/web`, live in production. See
> `docs/decisions.md` for what changed and why. The legacy `apps/api`/
> `apps/admin` (NestJS) codebase described in parts of this README below has
> been retired and removed — kept only in git history for reference.

Built on NestJS, PostgreSQL, and AWS (legacy) / Supabase, Paystack, and a React PWA (in progress). Designed for brides, grooms, coaches, suppliers, and administrators to plan, coordinate, and track weddings with clarity and confidence.

What STITCHD Is
STITCHD is a wedding management platform — not a generic services app. It gives every couple a live view of their wedding health through the Wedding Pulse™ readiness engine, connects them to vetted suppliers via a curated marketplace, pairs them with a dedicated coach, and keeps budget and timeline in one place.
The five things a user should understand within 5 seconds of opening the app:

How healthy their wedding is right now
What needs attention
How much budget remains
Who is helping them
Which suppliers are recommended


Repo Structure
stitchd/
├── apps/
│   └── web/       # React PWA — client (client lenses, supplier portal, admin, super-admin)
├── supabase/           # Postgres schema/RLS migrations + Deno Edge Functions (the new backend)
├── .github/
│   └── workflows/    # CI and deployment workflows
├── docs/             # Architecture, handover, and go-live docs
├── packages/
│   └── ui-tokens/    # Design tokens (evolving to the spec's 9-palette theme engine)
├── infra/
│   └── aws/          # AWS ECS + RDS + CloudFront deployment templates (legacy — being retired)
└── package.json      # Monorepo root

User Roles
RoleAccessClient (bride/groom)Dashboard, Timeline, Budget Pulse, Supplier Marketplace, Coach screenSupplierProfile management, booking requests, availabilityCoach / CoordinatorClient overview, task management, coach notes, messagingAdminEvent Command Centre — heatmap, risk alerts, escalations

Screens Built
Dashboard — Wedding Pulse™

Circular readiness score (0–100%) with colour-coded health state (green / amber / red)
KPI row: days to wedding, tasks complete, budget used, risk alerts
STITCHD Insights card — rule-based budget and supplier recommendations
Risk alert cards with impact level and action prompt
Wedding day weather forecast widget (live feed activates after budget is confirmed by client)
Coach notes summary and quick-contact actions

Supplier Marketplace

Horizontally scrollable supplier cards with hero image, rating, reliability score, price range, and capacity
Supplier badges: Verified, Top Rated, Fast Response, Best Value
Bundle cards (e.g. Venue + Decor + DJ) showing savings and readiness boost
Supplier detail with multi-dimension rating (Overall, Reliability, Communication, Value, Quality)

Timeline

Vertical milestone journey styled like a progress tracker
Dependency logic: tasks gate on prior completions (e.g. seating plan unlocks after venue confirmed)
Status states: completed, pending, at-risk, not-started

Budget Pulse™

Total budget, spent, remaining, and health status (Healthy / Watch / Risk)
Donut chart split by category: Venue, Decor, Catering, Entertainment, Photography, Other
Category line-item breakdown in rands
Savings identified summary
Live budget feeds and recommendations are gated — they display only after the client confirms their budget

Coach Screen

Coach profile card with photo, title, rating, and weddings-managed count
Quick-action buttons: Call, WhatsApp, Message, Schedule Meeting
Coach notes section
Latest messages thread

Event Command Centre (Admin/Coordinator only)

Risk summary widgets: weddings at risk, overdue tasks, supplier escalations
Readiness heatmap across all active weddings
Value-add marketplace carousel (Drone Photography, Photo Booth, Luxury Cars, etc.)

Auth Flow

Role-aware sign-in: Client, Supplier, Coach, Admin
Mobile OTP verification (Clickatell — SA numbers)
JWT-based session management with refresh tokens


API Modules
ModuleRoutesDescriptionauth/api/v1/auth/*OTP send/verify, JWT tokens, role-aware accessusers/api/v1/users/*Client and coordinator profilesevents/api/v1/events/*Wedding event records and metadatasuppliers/api/v1/suppliers/*Supplier onboarding, profiles, availabilitytasks/api/v1/tasks/*Timeline milestones and task managementbudgets/api/v1/budgets/*Budget allocation and category trackingcoaches/api/v1/coaches/*Coach profiles, notes, and assignmentrecommendations/api/v1/recommendations/*Rule-based insight and supplier suggestionsreviews/api/v1/reviews/*Ratings and reviews for suppliersnotifications/api/v1/notifications/*Stored notifications and Firebase FCM deliveryadmin/api/v1/admin/*Command centre APIs — risk feed, heatmap, escalations

Readiness Engine
The Wedding Pulse™ score is calculated from weighted category completion:
CategoryWeightVenue25%Catering15%Payments15%Decor10%Photographer10%Entertainment10%Timeline Tasks10%Guest Management5%
The engine runs as a rule-based computation on the backend. Full dynamic recalculation tied to live task and payment events is a Phase 2 enhancement, triggered when the client confirms go-live.

Live Feed Gate
Weather forecasts, live budget recommendations, and AI-powered insights are intentionally held behind a budget-confirmation gate. These feeds activate only once the client has reviewed and confirmed their total wedding budget inside the app. This prevents premature data display and ensures recommendations are grounded in real figures.

What Is Fully Built

Role-aware OTP auth and secure session management
Wedding event creation and client onboarding flow
Supplier marketplace with ratings, badges, and bundle cards
Timeline milestones with dependency logic
Budget Pulse with category breakdown and savings summary
Coach profile, quick-contact actions, and notes
Event Command Centre for admin and coordinator views
Rule-based STITCHD Insights engine
AWS-oriented CI/CD workflows (GitHub Actions → ECS Fargate)
Shared Springbok design token package
Full handover documentation suite


What Is Deferred to Go-Live
These items are not missing — they are intentionally staged for activation when the client is ready to go live:

Readiness Engine dynamic computation — backend rule engine is scaffolded; full DB-driven recalculation activates at go-live
PayFast payment gateway — wired and ready; requires real merchant credentials from client
Firebase push notifications — wired and ready; requires real Firebase project credentials
Twilio calling/messaging bridge — wired and ready; requires real Twilio credentials
Live weather API — widget is built; API key activates after budget confirmation
Final AWS staging and production rollout — deployment templates are complete; pending client infrastructure access


Quick Start — new stack (apps/web + supabase)
See `supabase/README.md` for the local Supabase dev loop (`npx supabase start`,
`npx supabase functions serve`). `apps/web` is a fresh Vite + React + PWA
skeleton — routing, auth, and the real lenses land through the rewrite phases
in `docs/decisions.md`.

bashcd apps/web && npm install && npm run dev

Branch strategy

main → production release
develop → staging
feature/* → PR to develop


Brand
Springbok Green  #007A4D   Primary actions, trust markers, health states
Gold Accent      #FFB81C   Badges, savings callouts, CTAs
Charcoal Black   #1C1C1C   High-contrast text
Ivory White      #F8F6F2   App shell and card surfaces
Design token source of truth: packages/ui-tokens

Reference Docs

docs/handover.md — delivery summary and next actions
docs/aws-architecture.md — infrastructure topology
docs/client-delivery-plan.md — phased delivery plan
docs/client-go-live-checklist.md — pre-launch checklist
docs/staging-secrets-checklist.md — secrets and credentials guide
docs/go-live-test-script.md — QA test script
docs/third-party-account-bootstrap.md — third-party setup sequence


Contributing
bashgit checkout -b feature/your-feature
# Commit with conventional commits: feat: / fix: / chore:
# Push and open a PR to develop
# CI must pass before merge

License
Proprietary. Source ownership remains with STITCHD (Pty) Ltd. See LICENSE.
