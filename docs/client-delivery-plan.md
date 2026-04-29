# KAZI Client Delivery Plan

## Product Direction

KAZI is being delivered as an AWS-hosted, South Africa-focused on-demand services MVP for Johannesburg. The product scope remains:

- Customer app
- Provider app
- Admin dashboard
- OTP auth
- Provider onboarding
- Service categories
- Instant and scheduled bookings
- Live provider tracking
- In-app chat and calling hooks
- Ratings and reviews
- Cash and online payments
- Wallet and earnings
- Commission controls
- Promo and referral engine
- Notifications
- Document uploads and verification
- Dashboard analytics

## Recommended Stack

- Mobile: Flutter
- Backend: NestJS
- Database: PostgreSQL
- Hosting: AWS
- Caching and queues: Redis
- Storage: S3
- CDN: CloudFront
- Payments: Peach Payments
- SMS: Clickatell
- Push: Firebase FCM

## Delivery Timeline

1. Weeks 1-2: backend foundation hardening, auth, users, environments, AWS baseline
2. Weeks 3-5: services, providers, bookings, realtime event model, admin data model
3. Weeks 6-9: Flutter customer app, Flutter provider app, shared service flows
4. Weeks 10-11: payments, wallet, promos, reviews, notifications, uploads
5. Weeks 12-14: admin dashboard, analytics, QA, staging, launch preparation

## Launch Strategy

1. Launch one city first: Johannesburg
2. Limit first categories to a small set with predictable supply
3. Verify provider supply before opening demand widely
4. Keep pricing, trust, and onboarding tight before expanding geography

## Cost Envelope

Expected AWS MVP run-rate in af-south-1:

- Lean single-environment setup: roughly R3,450 to R5,500 per month
- Safer production + staging setup: roughly R5,500 to R8,900 per month

These ranges depend on Fargate task count, RDS size, Redis sizing, storage growth, and traffic.