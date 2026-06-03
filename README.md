STITCHD

South Africa's premium wedding planning and coordination platform — Johannesburg-first MVP

Built on Flutter, NestJS, PostgreSQL, and AWS. Designed for brides, grooms, coaches, suppliers, and administrators to plan, coordinate, and track weddings with clarity and confidence.

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
│   ├── api/          # NestJS backend API
│   ├── admin/        # React Event Command Centre (coordinator/admin view)
│   └── mobile/       # Flutter client app (bride/groom, supplier, coach)
├── .github/
│   └── workflows/    # CI and deployment workflows
├── docs/             # Architecture, handover, and go-live docs
├── packages/
│   └── ui-tokens/    # Springbok design tokens (green, gold, ivory, charcoal)
├── infra/
│   └── aws/          # AWS ECS + RDS + CloudFront deployment templates
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


Quick Start
Prerequisites

Node.js 20+
Yarn 1.22+
Docker (optional, for local Postgres + Redis)
Flutter 3.x (for mobile)

1. Clone and install
bashgit clone https://github.com/MuziSitsha/Stitchd_Mvp.git
cd Stitchd_Mvp
yarn install
2. Environment setup
bashcp apps/api/.env.example apps/api/.env.local
# Fill in your PostgreSQL DATABASE_URL and other keys
3. Local database
bashdocker-compose up -d
# Starts Postgres on :5432 and Redis on :6379
4. Start development
bash# Backend API (port 3002)
yarn dev:api

# Admin dashboard (port 5173)
yarn dev:admin

# Flutter mobile app
cd apps/mobile
flutter pub get
flutter run

# Swagger API docs: http://127.0.0.1:3002/docs

AWS Deployment
Production target is AWS af-south-1, fronted by CloudFront and an ALB.
Cost estimate (monthly)
ServiceProviderCost/moPurposeAPI computeAWS ECS Fargate~R1,200–3,000NestJS APIDatabaseAWS RDS PostgreSQL~R1,000–2,500Primary data storeCacheAWS ElastiCache Redis~R700–1,500Jobs and throttlingFile storageAWS S3~R100–400Uploads and assetsAdmin hostingAWS Amplify / S3+CloudFront~R100–500Admin dashboardCDNAWS CloudFront~R150–800Static deliveryPushFirebase FCMFreeMobile notificationsSMS OTPClickatell~R200SA phone verification
Expected range: R3,450–R8,900 per month depending on traffic and task count.
Required GitHub Secrets for CI/CD
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_REGION
AWS_ECR_REPOSITORY
AWS_ECS_CLUSTER
AWS_ECS_SERVICE
AWS_ECS_TASK_FAMILY
AWS_ECS_EXECUTION_ROLE_ARN
AWS_ECS_TASK_ROLE_ARN
AWS_LOG_GROUP
PUBLIC_API_URL
DATABASE_URL
JWT_SECRET
JWT_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_PHONE
REDIS_ENABLED
REDIS_HOST
REDIS_PORT
REDIS_PASSWORD
CLICKATELL_API_KEY
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
PAYFAST_MERCHANT_ID
PAYFAST_MERCHANT_KEY
PAYFAST_PASSPHRASE
PAYFAST_MODE
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
AWS_S3_BUCKET_NAME
ALLOWED_ORIGINS
DEFAULT_COMMISSION_RATE
TEST_DATABASE_URL
VITE_API_BASE_URL
AWS_ADMIN_S3_BUCKET
AWS_ADMIN_CLOUDFRONT_DISTRIBUTION_ID
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
