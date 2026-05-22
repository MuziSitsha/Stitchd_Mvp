# STITCHD Third-Party Account Bootstrap

Use `sales@gubudo.com` as the owner email for the launch accounts where possible.

This document is the exact order to follow while creating the third-party services needed for STITCHD launch and handover.

## What Can Be Done Now

- prepare environment templates in the repo
- decide the account owner email
- decide staging and production naming
- prepare the secret list and runtime values

## What Still Requires External Account Creation

- Firebase project creation and push setup
- Google Maps project and API key creation
- Twilio account setup and number purchase
- PayFast merchant onboarding
- Clickatell account setup
- AWS account access and service provisioning

## Recommended Setup Order

### 1. Firebase

Create the Firebase project first using `sales@gubudo.com`.

Why first:

- push notifications depend on it
- mobile runtime values depend on it
- it unlocks real-device notification testing quickly

Collect:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_API_KEY`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_ANDROID_APP_ID`
- `FIREBASE_IOS_APP_ID`
- `FIREBASE_IOS_BUNDLE_ID`

### 2. Google Maps

Create the Google Maps setup next.

Why second:

- it improves address search and tracking quality
- it strengthens the Johannesburg booking flow

Collect:

- `GOOGLE_MAPS_API_KEY`
- Android maps key if using native SDK restrictions
- iPhone maps key if using native SDK restrictions

### 3. Twilio

Create Twilio using `sales@gubudo.com`.

Why third:

- it enables live booking calls
- the repo already supports fallback behavior until full calling is active

Collect:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

### 4. Clickatell

Set up Clickatell for South African OTP delivery.

Collect:

- `CLICKATELL_API_KEY`

### 5. PayFast

Start merchant onboarding as early as possible.

Why:

- this is often slower than technical setup
- even if the code is ready, merchant approval can delay launch

Collect:

- `PAYFAST_MERCHANT_ID`
- `PAYFAST_MERCHANT_KEY`
- `PAYFAST_PASSPHRASE`
- `PAYFAST_MODE`

### 6. AWS

Create or gain access to the AWS account once deployment access is available.

Short-term staging path:

- one PostgreSQL database
- one Redis instance
- one S3 bucket
- one API deployment target
- one admin hosting target

Collect:

- `DATABASE_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET_NAME`
- deployment secrets from the staging checklist

## Naming Recommendation

Use simple names so handover stays clean:

- Firebase project: `stitchd-staging`
- Google Cloud project: `stitchd-staging`
- AWS environment: `stitchd-staging`
- API domain: `api-staging.<client-domain>`
- Admin domain: `admin-staging.<client-domain>`

## Repo-First Next Step

Once any service is created, put the returned values into the staging template and then test one integration at a time.

Recommended repo order after account creation:

1. Firebase
2. Google Maps
3. Clickatell
4. Twilio
5. PayFast
6. AWS staging deployment