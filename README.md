# NexaStore - Premium Product CRUD

A comprehensive Next.js application with a premium UI for managing products.

## Tech Stacks & Daftar Teknologi (Versi Gabungan)

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Animations**: Framer Motion
- **Icons**: Lucide React

## Features
- ✨ Premium Glassmorphic Design
- 🚀 Server Actions for CRUD operations
- 🔍 Real-time client-side search and filtering
- 📱 Responsive layout for all devices
- 🌑 Dark-mode optimized aesthetic

## Getting Started

1. **Clone the repository** (if you haven't already)
2. **Install dependencies**:
   ```bash
   npm install
   ```
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
- **CI**: Runs on every push/PR to `main`. It performs linting, type checking, and build validation.
- **CD**: Automatically deploys to your server via SSH when a push is made to the `main` branch.

**Required GitHub Secrets:**
- `DEPLOY_HOST`: Your server IP/Hostname.
- `DEPLOY_USER`: SSH Username.
- `DEPLOY_KEY`: Your private SSH key.

<!-- Update terbaru dari Lead di main -->
<!-- Update main oleh DevOps -->
