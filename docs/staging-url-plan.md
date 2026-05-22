# STITCHD Staging URL Plan

## Locked Staging URLs

The recommended staging URLs are now locked as:

- API: https://api-staging.stitchd.co.za
- Admin: https://admin-staging.stitchd.co.za
- Mobile API base URL: https://api-staging.stitchd.co.za/api/v1

## Payment Callback URLs

- PayFast return URL: https://api-staging.stitchd.co.za/api/v1/payments/checkout/result
- PayFast webhook URL: https://api-staging.stitchd.co.za/api/v1/payments/webhooks/payfast

## Why These URLs

- they clearly separate staging from production
- they keep API and admin on stable subdomains
- they are suitable for Firebase, Twilio, PayFast, and AWS environment setup
- they align with a STITCHD-branded deployment path rather than local-only addresses

## If Domain Ownership Changes

If the final public domain is not `stitchd.co.za`, keep the same structure and replace only the root domain:

- `api-staging.<final-domain>`
- `admin-staging.<final-domain>`

Do not change route structure once PayFast, Firebase, and mobile staging builds are configured unless absolutely necessary.