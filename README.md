# NexaStore - Premium Product CRUD

A comprehensive Next.js application with a premium UI for managing products.

## Tech Stacks (Official DevOps Enterprise Release 2026)
- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Features
- ✨ Premium Glassmorphic Design
- 🚀 Server Actions for CRUD operations with server-side input validation
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
- **CI**: Runs on every push/PR to `main` or `master`. It performs linting, type checking, unit tests, a PostgreSQL-backed functional smoke test, build validation, and a critical production dependency audit.
- **Security**: CodeQL scans JavaScript/TypeScript, while tested form validation rejects malformed product data before database access.
- **Container**: Builds an `amd64` image and publishes both `latest` and immutable commit-SHA tags to GHCR.
- **CD**: A push to `main`/`master` deploys the tested SHA image to the `containment-server` self-hosted runner. There is no Raspberry Pi deployment target.
- **Performance gate**: Runs a local k6 smoke test after each successful deployment.
- **Scheduled test**: Runs a larger k6 load test every Sunday at 12:12 WIB and can also be started manually.

Production database credentials stay in `/home/containment/GSPE-Deployment/.env` on the server and are not rewritten by CI/CD. Database seeding is never run automatically in production.

The deployment runner requires the labels `self-hosted`, `linux`, `X64`, and `deployment`. Pull requests run CI and security checks only; deployment starts only after a push passes every gate.

Run the same checks locally with:

```bash
npm run lint
npx tsc --noEmit
npm test
npm audit --omit=dev --audit-level=critical
```

The performance thresholds are defined in `loadtest/site.js`: fewer than 1% failed requests, P95 below 1.5 seconds, P99 below 2.5 seconds, and more than 99% successful checks.

<!-- Update terbaru dari Lead di main -->
<!-- Update main oleh DevOps -->
