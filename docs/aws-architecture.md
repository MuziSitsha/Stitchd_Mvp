# KAZI AWS Architecture

## Region

- Primary AWS region: `af-south-1`
- Rationale: lowest latency for Johannesburg and South African users

## Runtime Topology

### Network

- One VPC
- Public subnets for ALB and NAT where needed
- Private subnets for ECS, RDS, and ElastiCache
- Security groups isolating API, database, and Redis traffic

### Backend API

- Amazon ECS Fargate for the NestJS API
- Application Load Balancer in front of the API
- Health endpoint: `/api/v1/health`
- ECR for container images
- CloudWatch Logs for application and container logs

### Database

- Amazon RDS PostgreSQL
- Multi-AZ optional for production hardening
- Automated backups enabled
- Separate databases or instances for staging and production

### Cache and Jobs

- Amazon ElastiCache for Redis
- Used for throttling, queued work, transient state, and future realtime coordination

### File Storage

- Amazon S3 for provider documents, user uploads, and media assets
- S3 lifecycle rules for archive and cleanup policies
- Presigned upload URLs from the API

### Admin Dashboard

- AWS Amplify Hosting or S3 + CloudFront
- Protected admin domain behind authentication and IP/security controls as needed

### Mobile Apps

- Flutter apps distributed through Play Store and App Store
- API consumed over HTTPS from the ALB/API domain
- Firebase FCM for push notifications

## Operational Model

### Environments

1. Local development
2. Staging on AWS
3. Production on AWS

### Secrets and Configuration

- AWS Secrets Manager or SSM Parameter Store for production secrets
- GitHub Actions stores only deployment credentials and non-runtime CI values

### CI/CD Target

- GitHub Actions builds container images
- Pushes images to Amazon ECR
- Triggers ECS service rollout for the API
- Admin dashboard deploys to Amplify or S3 + CloudFront

## Suggested AWS Environment Variables

```env
NODE_ENV=production
DATABASE_URL=postgresql://kazi_app:[PASSWORD]@[RDS-ENDPOINT]:5432/kazi_db
REDIS_HOST=[ELASTICACHE-ENDPOINT]
REDIS_PORT=6379
REDIS_PASSWORD=
JWT_SECRET=[LONG_RANDOM_SECRET]
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
AWS_REGION=af-south-1
AWS_ACCESS_KEY_ID=[DEPLOY_OR_APP_KEY]
AWS_SECRET_ACCESS_KEY=[DEPLOY_OR_APP_SECRET]
AWS_S3_BUCKET_NAME=kazi-uploads
ALLOWED_ORIGINS=https://admin.kazi.co.za
DEFAULT_COMMISSION_RATE=0.15
```

## Design System Direction

The UI should remain predominantly white with Springbok-inspired accents.

- Primary green: `#006B3C`
- Accent gold: `#FFB81C`
- White surfaces: `#FFFFFF`
- Warm light surface: `#F6F7F4`
- Text: `#111111`

Use the token package in `packages/ui-tokens` as the single source of truth for brand colours.