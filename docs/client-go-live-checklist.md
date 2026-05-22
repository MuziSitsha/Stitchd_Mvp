# STITCHD Client Go-Live Checklist

Use this checklist to collect the last external inputs needed to move the MVP from code-complete to live-ready.

## Credentials And Accounts

- Firebase project with FCM enabled for Android and iPhone push delivery
- Twilio account SID, auth token, and voice-capable phone number for booking calls
- PayFast merchant credentials: merchant ID, merchant key, passphrase, and approved webhook/return URLs
- Clickatell SMS credentials for South African OTP delivery
- Google Maps Platform key if the launch should move from open-map tracking to embedded maps and places services
- AWS production account or IAM deployment user with access to ECS, ECR, RDS, ElastiCache, S3, CloudFront, and Secrets Manager

## Infrastructure And Access

- Production `DATABASE_URL` for PostgreSQL
- Production Redis host, port, and password
- S3 bucket names and upload permissions for provider verification files
- Public API base URL for PayFast webhook callbacks and hosted checkout return URLs
- Admin deployment destination: Amplify or S3 plus CloudFront
- DNS access for the production API and admin domains
- GitHub repository secrets for the deployment workflows

## Product Decisions

- Final service categories and launch services for Johannesburg
- Default commission rate and any launch promo rules
- Whether cash payments, card payments, EFT, and wallet payments all launch on day one
- Provider document requirements for verification in South Africa
- Customer support contact details and cancellation policy text
- Final referral reward amount and promo expiry rules

## Brand Assets

- Approved STITCHD wordmark or logo files
- Final font preference if the current Springbok palette is kept but typography changes
- Final app store copy, screenshots, and privacy policy links

## Launch Validation

- One reachable staging or production API URL for Android and iPhone testing
- At least one real customer device and one provider device for end-to-end booking, tracking, chat, payment, and notification testing
- One admin user token for dashboard validation against live or staging data
- A list of launch-day team contacts for engineering, operations, and payment support

## Current Code Status

These areas are already implemented in the repository and mainly need live credentials, rollout access, or device validation:

- Customer and provider mobile flows
- Admin dashboard operations
- OTP auth and role-aware access
- Provider onboarding and document upload
- Service categories and booking flow
- Instant and scheduled bookings
- Live provider tracking updates
- Booking chat and call flow
- Ratings and reviews
- Cash, wallet, and hosted online payment flow
- Wallet balances and provider earnings
- Admin commission settings and analytics summary
- Promo and referral engine
- Stored notifications and push wiring
- AWS deployment direction and CI