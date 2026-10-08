# NexaStore - Premium Product CRUD

A comprehensive Next.js application with a premium UI for managing products.

## Tech Stacks (Official DevOps Enterprise Release 2026)
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Features
- ✨ Premium Glassmorphic Design
- 🚀 Server Actions for CRUD operations with Redis Caching
- 🔍 Real-time client-side search and filtering
- 📱 Responsive layout for all devices
- 🌑 Dark-mode optimized aesthetic

## Getting Started

1. **Clone the repository** (if you haven't already)
2. **Install dependencies**:
   ```bash
   npm install
   ```
   Node.js 22 or newer is recommended.
3. **Set up your Database**:
   Create a `.env` file in the root directory and add your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
   ```
4. **Initialize Prisma**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. **Run the development server**:
   ```bash
   npm run dev
   ```

## Deployment

### Docker Deployment (Recommended)
This project is fully dockerized for production.
1. Ensure Docker and Docker Compose are installed.
2. Run the deployment script:
   ```bash
   ./deploy.sh up
   ```

### CI/CD with GitHub Actions
The project includes a pre-configured GitHub Actions pipeline (`.github/workflows/deploy.yml`):
- **CI**: Runs on every push/PR to `main` or `master`. It performs linting, type checking, Prisma client generation, and build validation.
- **Container**: Builds multi-architecture (`amd64` and `arm64`) images and publishes both `latest` and commit-SHA tags to GHCR.
- **CD**: Deploys to the AWS and Raspberry Pi self-hosted runners after CI succeeds.
- **Performance gate**: Runs a k6 smoke test after each deployment when the corresponding public URL is configured.
- **Scheduled test**: Runs a larger k6 load test every Sunday at 12:12 WIB and can also be started manually.

**Required GitHub Secrets:**
- `POSTGRES_USER`: PostgreSQL username.
- `POSTGRES_PASSWORD`: PostgreSQL password.
- `POSTGRES_DB`: PostgreSQL database name.
- `DATABASE_URL`: Production PostgreSQL connection string.

**GitHub Variables:**
- `AWS_APP_URL`: Public AWS application URL used by k6, for example `https://aws.example.com`.
- `RASPI_APP_URL`: Public Raspberry Pi application URL used by k6.
- `RUN_DATABASE_SEED`: Set to `true` only when production data should be replaced with sample seed data. Leave unset/`false` for normal deployments.

The performance thresholds are defined in `loadtest/site.js`: fewer than 1% failed requests, P95 below 1.5 seconds, P99 below 2.5 seconds, and more than 99% successful checks.

<!-- Update terbaru dari Lead di main -->
<!-- Update main oleh DevOps -->
