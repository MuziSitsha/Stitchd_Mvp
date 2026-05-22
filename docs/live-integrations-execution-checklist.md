# STITCHD Live Integrations Execution Checklist

Use this document as the operational runbook for the live-integration phase.

This is the strict execution version of:

- docs/client-go-live-checklist.md
- docs/staging-secrets-checklist.md
- docs/third-party-account-bootstrap.md
- docs/go-live-test-script.md

Do not start production rollout until every staging item below is complete.

## Working Rules

- Work in staging first.
- Complete one integration at a time.
- Validate each integration before moving to the next one.
- Do not mix local-only testing with staging sign-off.
- Log every credential owner, environment value, callback URL, and validation result.

## Owner Guide

Suggested owners:

- Product: business decisions, launch scope, customer policy text
- Engineering: environment wiring, deployments, end-to-end fixes
- Ops: AWS, domains, secrets, deployment access
- Finance: PayFast setup, payout destination, settlement rules
- Support: support contacts, escalation flow, cancellation wording

## Phase 1: Freeze Launch Inputs

### Step 1. Confirm Johannesburg launch scope

Owner: Product
Dependency: none
Action:

- confirm launch service categories
- confirm initial service zones in Johannesburg
- confirm payment methods enabled on day one
- confirm cancellation policy
- confirm provider document requirements

Expected output:

- signed-off launch scope list
- signed-off launch services list
- signed-off policy text

### Step 2. Confirm business configuration defaults

Owner: Product and Finance
Dependency: Step 1
Action:

- confirm default commission rate
- confirm referral reward amount
- confirm promo rules and expiry windows
- confirm payout destination details

Expected output:

- signed-off business rules sheet

## Phase 2: Prepare Staging Secrets Register

### Step 3. Create the master staging secrets sheet

Owner: Ops and Engineering
Dependency: Steps 1 and 2
Action:

- create one secure staging register for all runtime values
- separate required values by integration
- mark each item as missing, received, loaded, or validated

Expected output:

- one complete staging secrets register

### Step 4. Lock all staging callback and public URLs

Owner: Ops and Engineering
Dependency: Step 3
Action:

- decide staging API URL
- decide staging admin URL
- decide mobile API base URL for real-device testing
- define PayFast return URL and webhook callback URL

Expected output:

- final staging URL list

## Phase 3: Create Third-Party Accounts

### Step 5. Create Firebase project

Owner: Engineering
Dependency: Step 4
Action:

- create Firebase project for staging
- add Android app
- add iPhone app if included in the test plan
- enable Firebase Cloud Messaging
- collect project credentials

Expected output:

- Firebase staging project
- all Firebase staging values stored in the secrets register

Validation:

- server can initialize Firebase credentials without runtime error

### Step 6. Create Google Maps project

Owner: Engineering
Dependency: Step 4
Action:

- create Google Maps project
- enable required APIs for maps, places, and address support if needed
- collect and store staging API key
- apply basic restrictions

Expected output:

- working staging maps key

Validation:

- app can load the intended tracking or address experience in staging

### Step 7. Create Clickatell account for OTP

Owner: Engineering
Dependency: Step 3
Action:

- create Clickatell account
- collect API key
- store key in staging secrets

Expected output:

- working Clickatell staging credential

Validation:

- staging OTP can be sent to a South African number

### Step 8. Create Twilio account and number

Owner: Engineering
Dependency: Step 3
Action:

- create Twilio account
- acquire a voice-capable number
- collect SID, auth token, and number
- store values in staging secrets

Expected output:

- working Twilio staging credential set

Validation:

- booking call flow can be triggered in staging

### Step 9. Start PayFast merchant setup

Owner: Finance and Engineering
Dependency: Step 4
Action:

- create or finalize PayFast merchant onboarding
- collect entity ID, secret, and mode
- register staging return URL and webhook URL
- store values in staging secrets

Expected output:

- working PayFast staging credential set

Validation:

- hosted checkout opens from staging
- webhook is accepted by staging API

## Phase 4: Provision AWS Staging

### Step 10. Provision AWS baseline in af-south-1

Owner: Ops
Dependency: Step 3
Action:

- provision PostgreSQL
- provision Redis
- provision S3 bucket for uploads
- provision API runtime target
- provision admin hosting target
- prepare deployment access and secrets storage

Expected output:

- complete staging infrastructure baseline

### Step 11. Load staging secrets into the deployment platform

Owner: Ops and Engineering
Dependency: Steps 5 through 10
Action:

- load backend core secrets
- load integration secrets
- load storage and AWS values
- load mobile runtime values
- load admin runtime values if needed

Expected output:

- all staging secrets loaded and versioned in the deployment platform

Validation:

- no missing secret at runtime during app startup

## Phase 5: Deploy And Validate Backend

### Step 12. Deploy staging API

Owner: Engineering
Dependency: Step 11
Action:

- deploy the NestJS API to staging
- run migrations
- verify health endpoint
- verify docs endpoint

Expected output:

- reachable staging API

Validation:

- health endpoint returns success
- docs endpoint loads
- database and Redis connect successfully

### Step 13. Validate uploads and provider document storage

Owner: Engineering
Dependency: Step 12
Action:

- upload provider verification files through the real API path
- verify objects are stored in S3 correctly
- confirm returned document records are persisted

Expected output:

- working document upload path in staging

## Phase 6: Deploy And Validate Admin

### Step 14. Deploy staging admin dashboard

Owner: Engineering and Ops
Dependency: Steps 11 and 12
Action:

- deploy the admin app
- validate login
- validate dashboard loading against staging API

Expected output:

- reachable staging admin dashboard

Validation:

- admin login works
- metrics load
- settings load
- recent payments load

### Step 15. Validate admin operations

Owner: Product and Engineering
Dependency: Step 14
Action:

- update commission settings
- open provider verification queue
- approve or reject a provider document submission

Expected output:

- admin operational sign-off in staging

## Phase 7: Connect And Validate Mobile Runtime

### Step 16. Point customer and provider app builds to staging API

Owner: Engineering
Dependency: Step 12
Action:

- set mobile API base URL to staging
- set payment return URL if needed
- load Firebase mobile values

Expected output:

- testable staging mobile builds

### Step 17. Validate OTP and authentication end to end

Owner: Engineering
Dependency: Steps 7, 12, and 16
Action:

- test customer OTP login
- test provider OTP login
- test invalid OTP path

Expected output:

- authentication sign-off in staging

### Step 18. Validate provider onboarding and verification lifecycle

Owner: Engineering and Product
Dependency: Steps 13, 15, and 16
Action:

- complete provider onboarding
- upload documents
- review documents in admin
- confirm provider status updates

Expected output:

- provider onboarding sign-off in staging

## Phase 8: Validate Revenue And Communications

### Step 19. Validate online payments

Owner: Engineering and Finance
Dependency: Step 9 and Step 12
Action:

- create a booking requiring hosted checkout
- open PayFast hosted checkout
- complete the payment
- confirm callback and webhook handling
- confirm booking payment status is updated correctly

Expected output:

- online payment sign-off in staging

### Step 20. Validate cash and wallet behavior

Owner: Engineering
Dependency: Step 12
Action:

- complete a cash booking
- confirm booking settlement path
- confirm wallet or earnings ledger behavior
- test insufficient wallet balance path

Expected output:

- cash and wallet sign-off in staging

### Step 21. Validate push notifications

Owner: Engineering
Dependency: Steps 5, 12, and 16
Action:

- trigger booking lifecycle notifications
- confirm stored notifications are created
- confirm push notifications arrive on device

Expected output:

- notifications sign-off in staging

### Step 22. Validate chat and calling

Owner: Engineering
Dependency: Steps 8, 12, and 16
Action:

- test booking chat between customer and provider
- test booking call trigger
- test fallback behavior if the call bridge does not complete

Expected output:

- communications sign-off in staging

## Phase 9: Full End-To-End Staging QA

### Step 23. Run customer flow from the go-live script

Owner: Engineering and Product
Dependency: Steps 17 through 22
Action:

- execute every customer flow in docs/go-live-test-script.md

Expected output:

- customer staging QA pass report

### Step 24. Run provider flow from the go-live script

Owner: Engineering and Product
Dependency: Steps 17 through 22
Action:

- execute every provider flow in docs/go-live-test-script.md

Expected output:

- provider staging QA pass report

### Step 25. Run admin flow from the go-live script

Owner: Engineering and Product
Dependency: Steps 14 through 22
Action:

- execute every admin flow in docs/go-live-test-script.md

Expected output:

- admin staging QA pass report

### Step 26. Fix only launch-blocking defects

Owner: Engineering
Dependency: Steps 23 through 25
Action:

- fix blockers in auth, booking, payment, verification, notifications, chat, calling, and analytics
- do not expand scope with non-launch features

Expected output:

- clean blocker list or zero open launch blockers

## Phase 10: Production Readiness

### Step 27. Prepare production environment copy

Owner: Ops and Engineering
Dependency: staging sign-off
Action:

- create production secrets
- create production domains
- create production callback URLs
- verify production payment and notification configuration

Expected output:

- production environment ready for rollout

### Step 28. Repeat smoke tests on production

Owner: Engineering and Product
Dependency: Step 27
Action:

- repeat the highest-risk customer, provider, and admin tests on production

Expected output:

- production smoke-test pass report

## Sign-Off Criteria

Mark the live integrations phase complete only when:

- all staging secrets are loaded
- staging API is externally reachable
- staging admin is externally reachable
- OTP works with a South African number
- hosted checkout works end to end
- push notifications arrive on device
- call flow works or approved fallback is confirmed
- provider uploads and verification work end to end
- customer flow passes
- provider flow passes
- admin flow passes
- no launch-blocking issues remain

## Immediate Start Order

If execution starts today, begin with:

1. Step 1: confirm launch scope
2. Step 2: confirm business defaults
3. Step 3: create staging secrets register
4. Step 4: lock staging URLs
5. Step 5: create Firebase project
