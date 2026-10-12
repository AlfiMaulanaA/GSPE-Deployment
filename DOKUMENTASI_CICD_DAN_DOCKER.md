# 📘 Dokumentasi Lengkap Arsitektur CI/CD & Docker (NexaStore)

Dokumen ini menjelaskan secara menyeluruh bagaimana sistem **Continuous Integration & Continuous Deployment (CI/CD)**, **pemisahan lingkungan Staging vs Production**, **arsitektur kontainer Docker**, serta **panduan linting kode per folder** bekerja pada proyek ini.

---

## 🗺️ 1. Diagram Alur Kerja CI/CD (Staging & Production)

```mermaid
flowchart TD
    subgraph Local [Developer Workspace]
        Dev[Developer] -->|git push origin staging| Branch_Staging[Branch: staging]
        Dev -->|git push origin main| Branch_Main[Branch: main / master]
    end

    subgraph GitHub_Actions [GitHub Actions Cloud Runner]
        Branch_Staging --> CI_Verify[Stage 1: Verify & Test\n- Postgres Service Container\n- Lint, Typecheck, Vitest Unit Test\n- Audit Critical Vuln\n- Build Standalone & Smoke Test]
        Branch_Main --> CI_Verify

        Branch_Staging --> CI_Security[Stage 2: CodeQL SAST\n- Security & Vulnerability Scan]
        Branch_Main --> CI_Security

        CI_Verify --> Gate{Lulus Semua Tes?}
        CI_Security --> Gate

        Gate -- Ya (Branch == staging) --> Build_Staging[Stage 3: Build & Publish Staging Image\n- Tag :staging & :SHA\n- Push to GHCR]
        Gate -- Ya (Branch == main) --> Build_Prod[Stage 3: Build & Publish Prod Image\n- Tag :latest & :SHA\n- Push to GHCR]
        Gate -- Gagal --> Notify_Fail[Stage 6: Discord Notify ❌]
    end

    subgraph Server [Containment Server 192.168.2.42]
        Build_Staging --> Runner_Staging[Runner: containment-server-staging\nLabel: staging]
        Runner_Staging --> Deploy_Staging[Stage 4: Deploy Staging Container\n- Folder: $HOME/GSPE-Deployment-Staging\n- Container: gspe-app-staging\n- Port Host: 3001\n- DB: gspe_staging]
        Deploy_Staging --> Smoke_Staging[Stage 5: Smoke Test k6 Staging\n- Target: http://127.0.0.1:3001]

        Build_Prod --> Runner_Prod[Runner: containment-server\nLabel: production]
        Runner_Prod --> Deploy_Prod[Stage 4: Deploy Production Container\n- Folder: $HOME/GSPE-Deployment\n- Container: gspe-app\n- Port Host: 3000\n- DB: gspe_deployment]
        Deploy_Prod --> Smoke_Prod[Stage 5: Smoke Test k6 Production\n- Target: http://127.0.0.1:3000]
    end

    subgraph Notification [Discord Channel]
        Smoke_Staging -- Sukses --> Notify_Staging[Stage 6: Discord Notify 🚀\n- Staging Succeeded on Port 3001]
        Smoke_Prod -- Sukses --> Notify_Prod[Stage 6: Discord Notify 🚀\n- Production Succeeded on Port 3000]
        Smoke_Staging -- Gagal --> Notify_Fail
        Smoke_Prod -- Gagal --> Notify_Fail
    end
```

---

## ⚙️ 2. Rincian Step-by-Step Pipeline CI/CD (`deploy.yml`)

Pipeline didefinisikan pada [.github/workflows/deploy.yml](file:///.github/workflows/deploy.yml) dan terbagi menjadi 6 tahapan utama:

### 🔹 Tahap 1: Verify (`Test application and database`)
* **Lingkungan:** `ubuntu-24.04` dengan *service container* `postgres:16-alpine`.
* **Langkah-langkah:**
  1. `actions/checkout`: Mengambil kode sumber repository.
  2. `setup-node`: Menyiapkan runtime Node.js 22 dengan caching npm.
  3. `npm ci`: Instalasi dependensi secara bersih dan deterministik.
  4. `npx prisma generate`: Men-generate TypeScript client Prisma ORM.
  5. `npm run lint`: Memvalidasi aturan sintaks via ESLint.
  6. `npx tsc --noEmit`: Memvalidasi seluruh type safety TypeScript tanpa kompilasi file fisik.
  7. `npm run test:ci`: Menjalankan seluruh test suite unit testing via **Vitest** (13 test cases validasi form & input produk).
  8. `npm audit --omit=dev --audit-level=critical`: Memindai kerentanan dependensi berstatus kritis.
  9. `npx prisma db push & npm run seed`: Melakukan migrasi skema tabel ke database PostgreSQL uji coba dan mengisi data awal.
  10. `npm run build`: Memvalidasi kompilasi Next.js *standalone build*.
  11. `Functional smoke test`: Menjalankan server Next.js di background (`server.js`), lalu melakukan `curl` ke `http://127.0.0.1:3000/` untuk memverifikasi halaman HTML render string `NEXASTORE`.

### 🔹 Tahap 2: CodeQL (`CodeQL security analysis`)
* **Lingkungan:** `ubuntu-24.04`.
* **Tujuan:** Static Application Security Testing (SAST) otomatis untuk mendeteksi celah keamanan (seperti injection, XSS, prototype pollution) pada kode JavaScript/TypeScript sebelum dirilis.

### 🔹 Tahap 3: Build & Publish Container (`build-and-push`)
* **Syarat:** Berjalan hanya saat event `push` (bukan Pull Request) dan setelah Tahap 1 & 2 lulus 100%.
* **Langkah-langkah:**
  1. Mengidentifikasi branch target:
     * Jika branch `staging` $\rightarrow$ Image diberi tag `:staging` dan `:<commit-sha>`.
     * Jika branch `main` $\rightarrow$ Image diberi tag `:latest` dan `:<commit-sha>`.
  2. Menggunakan **Docker Buildx** dengan platform target `linux/amd64`.
  3. Mengaktifkan GitHub Actions cache (`type=gha`) agar build berikutnya berlangsung cepat.
  4. Mengunggah image ke **GitHub Container Registry (GHCR)** di `ghcr.io/alfimaulanaa/gspe-deployment`.

### 🔹 Tahap 4: Deploy Terisolasi (Staging vs Production)
GitHub Actions menggunakan **runner label** untuk menembak daemon runner yang tepat:
* **Jika Branch `staging` $\rightarrow$ Job `deploy-staging`:**
  * Dijalankan oleh runner bertag `[self-hosted, linux, X64, staging]`.
  * Masuk ke folder `$HOME/GSPE-Deployment-Staging`.
  * Memasang [docker-compose.staging.yml](file:///docker-compose.staging.yml).
  * Menyalakan container `gspe-app-staging` di port **3001** dengan database terpisah `gspe_staging`.
* **Jika Branch `main` $\rightarrow$ Job `deploy-production`:**
  * Dijalankan oleh runner bertag `[self-hosted, linux, X64, production]`.
  * Masuk ke folder `$HOME/GSPE-Deployment`.
  * Memasang [docker-compose.yml](file:///docker-compose.yml).
  * Menyalakan container `gspe-app` di port **3000** dengan database utama `gspe_deployment`.

### 🔹 Tahap 5: Post-Deployment Smoke Test
* Menjalankan script **k6** ([loadtest/site.js](file:///loadtest/site.js)) menggunakan runner yang bersangkutan:
  * Staging menguji endpoint `http://127.0.0.1:3001`.
  * Production menguji endpoint `http://127.0.0.1:3000`.

### 🔹 Tahap 6: Discord Deployment Notification (`notify`)
* Berjalan otomatis (`if: always() && github.event_name == 'push'`).
* Bot mengirimkan **Discord Rich Embed**:
  * Menyebutkan secara akurat nama lingkungan: `Staging (Port 3001)` atau `Production (Port 3000)`.
  * 🟢 **Hijau (`#57F287`):** Deploy & Smoke test sukses.
  * 🔴 **Merah (`#ED4245`):** Gagal, dengan tombol langsung ke log GitHub Actions.

---

## 🔍 3. Panduan Linting & Validasi Kode (ESLint)

### ❓ "Apakah untuk cek lint itu bisa ke spesifik folder?"
**JAWABANNYA: BISA BANGET!**

Secara bawaan, ESLint dapat diarahkan langsung ke path folder atau file tertentu yang ingin Anda periksa tanpa harus memindai seluruh proyek.

### 📌 Cara Menggunakan Linting Spesifik Folder:

#### 1. Menggunakan Shortcut `npm run` (Sudah Ditambahkan ke `package.json`)
Di file [package.json](file:///package.json), kita telah menyiapkan script pintas:
```bash
# Periksa hanya folder components (ProductCard, Dashboard, ProductForm)
npm run lint:components

# Periksa hanya folder app (page.tsx, layout.tsx, Server Actions)
npm run lint:app

# Periksa hanya folder lib (prisma client, validasi produk)
npm run lint:lib

# Auto-fix kesalahan styling/formatting yang bisa diperbaiki otomatis
npm run lint:fix
```

#### 2. Menggunakan Argumen CLI Langsung (`npx eslint` atau `npm run lint --`)
Anda bisa memeriksa folder atau file kustom apa pun secara dinamis:
```bash
# Memeriksa folder spesifik
npx eslint src/components/
npx eslint src/app/actions/

# Memeriksa file spesifik saja
npx eslint src/components/ProductCard.tsx

# Melewatkan folder argumen melalui npm run lint
npm run lint -- src/components/
npm run lint -- src/lib/

# Memeriksa beberapa folder sekaligus
npx eslint src/components/ src/lib/
```

#### 3. Melakukan Perbaikan Otomatis (*Auto-fix*):
Jika terdapat error seperti spasi berlebih, unused imports, atau format tanda kutip:
```bash
npx eslint src/components/ --fix
```

---

## 🐳 4. Bedah Arsitektur File Docker (`Dockerfile`)

Aplikasi menggunakan **Multi-Stage Build** 3 lapis untuk efisiensi ukuran image dan keamanan maksimal:

```dockerfile
# ==========================================
# STAGE 1: DEPS (Pengumpulan Dependensi)
# ==========================================
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ==========================================
# STAGE 2: BUILDER (Kompilasi & Bundling)
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npx prisma generate
RUN npx esbuild prisma/seed.ts --bundle --platform=node --outfile=prisma/seed.js --external:@prisma/client
RUN npm run build

# ==========================================
# STAGE 3: RUNNER (Image Produksi Minimalis)
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install -g prisma@7.10.0

# Keamanan: Jalankan sebagai user non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Salin hanya artefak build yang dibutuhkan
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.js ./prisma.config.js
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

### Keuntungan Arsitektur Docker Ini:
1. **Multi-Stage:** *Source code*, compiler TypeScript, dan library testing (Vitest, Tailwind CLI) ditinggalkan di Stage 2.
2. **Next.js Standalone:** Mengurangi ukuran image dari >1.2GB menjadi hanya ~150MB.
3. **Keamanan User Non-Root:** Berjalan dengan UID 1001 (`nextjs`), mencegah eskalasi hak akses server host.
4. **Prisma Pre-bundled:** File seed dikonversi menjadi JS murni via `esbuild`.

---

## 📦 5. Bedah Orkestrasi Container (`docker-compose.yml`)

### File Produksi ([docker-compose.yml](file:///docker-compose.yml)):
* Menjalankan `gspe-app` (Port 3000) dan `gspe-db` (Postgres 16, DB: `gspe_deployment`).
* Memiliki `depends_on: condition: service_healthy` agar web server tidak menyala sebelum database siap.

### File Staging ([docker-compose.staging.yml](file:///docker-compose.staging.yml)):
* Menjalankan `gspe-app-staging` (Port 3001) dan `gspe-db-staging` (Postgres 16, DB: `gspe_staging`).
* Volume penyimpanan terpisah (`postgres_staging_data`), menjamin data produksi tidak tersentuh saat staging diuji.

---

## 🎯 6. Ringkasan Parameter Lingkungan

| Parameter | Lingkungan Staging | Lingkungan Production |
| :--- | :--- | :--- |
| **Branch Git** | `staging` | `main` / `master` |
| **Runner Daemon** | `containment-server-staging` | `containment-server` |
| **Runner Label** | `staging` | `production` |
| **Folder Server** | `/home/containment/GSPE-Deployment-Staging` | `/home/containment/GSPE-Deployment` |
| **Port Akses** | **`http://192.168.2.42:3001`** | **`http://192.168.2.42:3000`** |
| **Container Name** | `gspe-app-staging` | `gspe-app` |
| **Database Name** | `gspe_staging` | `gspe_deployment` |
| **Image Tag GHCR** | `:staging` & `:<sha>` | `:latest` & `:<sha>` |
