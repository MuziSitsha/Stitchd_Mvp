# STITCHD GitHub Actions Staging Secrets Checklist

Use this checklist to populate GitHub Actions secrets for the repository before triggering the staging deploy workflows.

Repository target:

- `MuziSitsha/stitchd-platform`

GitHub path:

- `Settings` -> `Secrets and variables` -> `Actions` -> `New repository secret`

## Deploy Workflows Covered

- `.github/workflows/deploy-aws.yml`
- `.github/workflows/deploy-admin.yml`
- `.github/workflows/ci-cd.yml`

## Secrets To Add Now

These are the values required to deploy the current staging stack.

### AWS deployment access

| Secret | Required | Recommended staging value / source |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | yes | GitHub Actions deployment IAM user or role-access key |
| `AWS_SECRET_ACCESS_KEY` | yes | Matching deployment secret |
| `AWS_REGION` | yes | `af-south-1` |

### API image and ECS rollout

| Secret | Required | Recommended staging value / source |
|---|---|---|
| `AWS_ECR_REPOSITORY` | yes | Existing ECR repo for the API image |
| `AWS_ECS_CLUSTER` | yes | Existing ECS cluster name |
| `AWS_ECS_SERVICE` | yes | Existing ECS service name |
| `AWS_ECS_TASK_FAMILY` | yes | ECS task family name used for the API |
| `AWS_ECS_EXECUTION_ROLE_ARN` | yes | ECS execution role ARN |
| `AWS_ECS_TASK_ROLE_ARN` | yes | ECS task role ARN with S3 access |
| `AWS_LOG_GROUP` | yes | CloudWatch log group for the API task |

### API runtime configuration

| Secret | Required | Recommended staging value / source |
|---|---|---|
| `PUBLIC_API_URL` | yes | `https://api-staging.stitchd.co.za` |
| `DATABASE_URL` | yes | Staging PostgreSQL connection string |
| `JWT_SECRET` | yes | Long random secret |
| `JWT_EXPIRES_IN` | yes | `7d` |
| `JWT_REFRESH_EXPIRES_IN` | yes | `30d` |
| `ADMIN_EMAIL` | yes | `sales@gubudo.com` unless business changes it |
| `ADMIN_PASSWORD` | yes | Staging admin bootstrap password from password manager |
| `ADMIN_PHONE` | yes | `+27820000000` or the approved admin bootstrap number |
| `ADMIN_FIRST_NAME` | yes | `STITCHD` |
| `ADMIN_LAST_NAME` | yes | `Admin` |
| `REDIS_ENABLED` | yes | `false` for current staging deploy |
| `ALLOWED_ORIGINS` | yes | `https://admin-staging.stitchd.co.za` |
| `DEFAULT_COMMISSION_RATE` | yes | `0.15` unless business confirms a different default |

### Firebase server-side push configuration

| Secret | Required | Recommended staging value / source |
|---|---|---|
| `FIREBASE_PROJECT_ID` | yes | `stitchd-staging` |
| `FIREBASE_CLIENT_EMAIL` | yes | Firebase service account client email |
| `FIREBASE_PRIVATE_KEY` | yes | Firebase service account private key with preserved line breaks |

### Admin frontend build target

| Secret | Required | Recommended staging value / source |
|---|---|---|
| `VITE_API_BASE_URL` | yes | `https://api-staging.stitchd.co.za/api/v1` |
| `AWS_ADMIN_S3_BUCKET` | yes | S3 bucket for admin static hosting |
| `AWS_ADMIN_CLOUDFRONT_DISTRIBUTION_ID` | yes | CloudFront distribution serving admin staging |

### CI validation

| Secret | Required | Recommended staging value / source |
|---|---|---|
| `TEST_DATABASE_URL` | yes | Separate PostgreSQL connection string for CI tests |

## Secrets That Can Stay Empty For This Deploy

These are referenced by the API workflow, but the current code path will still boot without them if the related features are not exercised.

| Secret | Can omit now | Why |
|---|---|---|
| `REDIS_HOST` | yes | Queues are disabled when `REDIS_ENABLED=false` |
| `REDIS_PORT` | yes | Same as above |
| `REDIS_PASSWORD` | yes | Same as above |
| `CLICKATELL_API_KEY` | yes | OTP only sends live SMS in production mode; staging can remain unset if that flow is not under test |
| `GOOGLE_MAPS_API_KEY` | yes | Only needed once maps/tracking launch validation starts |
| `PAYFAST_MERCHANT_ID` | yes | Needed for hosted checkout staging validation |
| `PAYFAST_MERCHANT_KEY` | yes | Paired with the merchant ID |
| `PAYFAST_PASSPHRASE` | yes | Needed when the PayFast account uses a passphrase |
| `PAYFAST_MODE` | yes | Defaults in app config already cover a non-production mode |
| `TWILIO_ACCOUNT_SID` | yes | Call flow falls back when Twilio is unset |
| `TWILIO_AUTH_TOKEN` | yes | Same as above |
| `TWILIO_PHONE_NUMBER` | yes | Same as above |

## AWS App Credentials Note

The API no longer needs static runtime `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` inside the ECS container when the ECS task role already has S3 permissions.

That means these runtime secrets are optional and should be omitted unless the ECS task role cannot access S3:

- `APP_AWS_ACCESS_KEY_ID`
- `APP_AWS_SECRET_ACCESS_KEY`

## Current Workflow Fit Check

Current workflow expectations match the repository state:

- `deploy-aws.yml` now injects API runtime secrets into the rendered ECS task definition.
- `deploy-admin.yml` now builds the admin bundle against `VITE_API_BASE_URL`.
- `ci-cd.yml` still requires `TEST_DATABASE_URL` for API tests.
- The API can boot in `NODE_ENV=production` with `REDIS_ENABLED=false`.

## Manual Entry Order

Use this order in GitHub so you can trigger deploys immediately after.

1. Add AWS deployment secrets.
2. Add API runtime secrets.
3. Add Firebase server-side secrets.
4. Add admin hosting secrets.
5. Add `TEST_DATABASE_URL` for CI.
6. Trigger `Deploy STITCHD API to AWS`.
7. Trigger `Deploy STITCHD Admin to AWS`.