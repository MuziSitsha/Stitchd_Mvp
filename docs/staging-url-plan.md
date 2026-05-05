# KAZI Staging URL Plan

## Locked Staging URLs

The recommended staging URLs are now locked as:

- API: https://api-staging.kazi.co.za
- Admin: https://admin-staging.kazi.co.za
- Mobile API base URL: https://api-staging.kazi.co.za/api/v1

## Payment Callback URLs

- Peach return URL: https://api-staging.kazi.co.za/api/v1/payments/checkout/result
- Peach webhook URL: https://api-staging.kazi.co.za/api/v1/payments/webhooks/peach

## Why These URLs

- they clearly separate staging from production
- they keep API and admin on stable subdomains
- they are suitable for Firebase, Twilio, Peach, and AWS environment setup
- they align with a KAZI-branded deployment path rather than local-only addresses

## If Domain Ownership Changes

If the final public domain is not `kazi.co.za`, keep the same structure and replace only the root domain:

- `api-staging.<final-domain>`
- `admin-staging.<final-domain>`

Do not change route structure once Peach, Firebase, and mobile staging builds are configured unless absolutely necessary.