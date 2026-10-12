# 📘 Dokumentasi Lengkap Arsitektur CI/CD & Docker (NexaStore)

Dokumen ini menjelaskan secara menyeluruh bagaimana sistem **Continuous Integration & Continuous Deployment (CI/CD)** serta **arsitektur kontainer Docker** bekerja pada proyek ini.

---

## 🗺️ 1. Diagram Alur Kerja CI/CD

```mermaid
flowchart TD
    subgraph Local [Developer Workspace]
        Dev[Developer] -->|git push origin main / staging| GitHub[GitHub Repository]
    end

    subgraph GitHub_Actions [GitHub Actions Cloud Runner]
        GitHub --> CI_Verify[Stage 1: Verify & Test\n- Postgres Service Container\n- Lint, Typecheck, Vitest Unit Test\n- Audit Critical Vuln\n- Build Standalone & Smoke Test]
        GitHub --> CI_Security[Stage 2: CodeQL SAST\n- Security & Vulnerability Scan]

        CI_Verify --> Gate{Lulus Semua Tes?}
        CI_Security --> Gate

        Gate -- Ya (Event == push) --> Build_Push[Stage 3: Build & Publish Container\n- Docker Buildx multi-stage\n- Tag :latest / :staging & :SHA\n- Push to GHCR ghcr.io]
        Gate -- Tidak --> Notify_Fail[Stage 6: Discord Notify ❌]
    end

    subgraph Server [Containment Server 192.168.2.42]
        Build_Push --> Runner[Stage 4: Self-Hosted Runner\n- containment-server daemon]
        Runner --> Pull_Image[Docker Compose Pull Image SHA]
        Pull_Image --> Up_Container[Docker Compose Up gspe-app]
        Up_Container --> DB_Migrate[Prisma DB Push Auto Migration]
        DB_Migrate --> Health_Check[Curl Health Check 3000]

        Health_Check --> Post_Smoke[Stage 5: Post-Deploy Smoke Test\n- k6 Performance Test]
    end

    subgraph Notification [Discord Channel]
        Post_Smoke -- Sukses --> Notify_Success[Stage 6: Discord Notify 🚀\n- Green Embed, Commit, Author, Logs]
        Post_Smoke -- Gagal --> Notify_Fail
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
  3. Mengaktifkan GitHub Actions cache (`type=gha`) agar build berikutnya berlangsung cepat (hanya layer yang berubah yang di-compile).
  4. Mengunggah image ke **GitHub Container Registry (GHCR)** di `ghcr.io/alfimaulanaa/gspe-deployment`.

### 🔹 Tahap 4: Deploy to Containment Server (`deploy-server`)
* **Lingkungan:** **Self-Hosted Runner** bertag `[self-hosted, linux, X64, deployment]` yang terpasang langsung di server fisik Containment (`192.168.2.42`).
* **Langkah-langkah:**
  1. Runner membaca direktori `$HOME/GSPE-Deployment` di server containment.
  2. Login ke GHCR menggunakan token aman GitHub Actions.
  3. Mengambil image baru yang spesifik berdasarkan commit SHA (`APP_IMAGE`).
  4. Menjalankan `docker compose up -d --remove-orphans` untuk mematikan container lama dan menyalakan container baru tanpa downtime lama.
  5. Menjalankan migrasi skema database di dalam container produksi:
     ```bash
     docker exec gspe-app npx prisma db push
     ```
  6. Loop polling `curl` selama 30 percobaan ke `http://127.0.0.1:3000/` untuk memastikan aplikasi sehat dan melayani request.

### 🔹 Tahap 5: Post-Deployment Smoke Test (`smoke-test-server`)
* Menggunakan reusable workflow [.github/workflows/performance-test.yml](file:///.github/workflows/performance-test.yml).
* Menjalankan script **k6** ([loadtest/site.js](file:///loadtest/site.js)) langsung dari runner untuk menguji respon latency HTTP 200 dengan kriteria:
  * P95 latency di bawah 1.5 detik
  * Tingkat keberhasilan request di atas 99%

### 🔹 Tahap 6: Discord Deployment Notification (`notify`)
* Berjalan otomatis (`if: always() && github.event_name == 'push'`).
* Membaca secret `DISCORD_WEBHOOK` yang tersimpan di GitHub Secrets.
* Mengirim notifikasi **Discord Rich Embed**:
  * 🟢 **Hijau (`#57F287`):** Menandakan aplikasi sukses di-build, dideploy, dan lolos smoke test.
  * 🔴 **Merah (`#ED4245`):** Menandakan ada kegagalan, lengkap dengan rincian tahap mana yang gagal dan tombol pintas ke log run GitHub Actions.

---

## 🐳 3. Bedah Arsitektur File Docker (`Dockerfile`)

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

### Mengapa Desain Docker Ini Sangat Optimal?
1. **Multi-Stage:** *Source code*, TypeScript compiler, dan file devDependencies (seperti ESLint, Vitest, tailwindcss) ditinggalkan di Stage 2 dan **tidak masuk** ke Image akhir di Stage 3.
2. **Next.js Standalone Output:** Fitur `output: "standalone"` Next.js hanya mengemas node_modules yang benar-benar digunakan saat runtime. Ukuran container menyusut dari >1GB menjadi hanya sekitar ~150MB.
3. **Non-Root Execution:** Container berjalan dengan user `nextjs` (UID 1001), bukan `root`, sehingga jika ada eksploitasi pada aplikasi, hacker tidak mendapatkan akses root ke server host.
4. **Prisma Global:** Script seed di-bundle menjadi JavaScript tunggal via `esbuild`, menghilangkan ketergantungan runtime TypeScript (`tsx`).

---

## 📦 4. Bedah Orkestrasi Container (`docker-compose.yml`)

File [docker-compose.yml](file:///docker-compose.yml) di server containment mengatur 2 service yang saling terhubung:

```yaml
services:
  app:
    image: ${APP_IMAGE:-ghcr.io/alfimaulanaa/gspe-deployment:latest}
    container_name: gspe-app
    restart: always
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}?schema=public
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    container_name: gspe-db
    restart: always
    environment:
      - POSTGRES_USER=${POSTGRES_USER:-gspe_admin}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-gspe_password}
      - POSTGRES_DB=${POSTGRES_DB:-gspe_deployment}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

* **`db` (PostgreSQL 16):** Memiliki healthcheck bawaan `pg_isready`. Data disimpan persisten pada volume Docker `postgres_data`.
* **`app` (NexaStore):** Memiliki dependensi `depends_on: condition: service_healthy` ke service `db`, artinya container aplikasi **hanya akan menyala setelah PostgreSQL benar-benar siap menerima koneksi query**.
* **Keamanan Kredensial:** Seluruh username dan password diambil dari file lokal host `/home/containment/GSPE-Deployment/.env` dan tidak pernah di-hardcode ke git.

---

## 🎯 5. Arsitektur Terpisah: Staging vs Production (Sudah Diimplementasikan)

Sistem saat ini telah resmi dikonfigurasi dengan pemisahan lingkungan **100% independen** menggunakan **Dual-Runner & Dual-Container**:

| Lingkungan | Branch Pemicu | Runner yang Aktif | Target Direktori di Server | Port Host | Container Name |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Staging** | `staging` | `containment-server-staging` (label: `staging`) | `$HOME/GSPE-Deployment-Staging` | **3001** | `gspe-app-staging` |
| **Production** | `main` / `master` | `containment-server` (label: `production`) | `$HOME/GSPE-Deployment` | **3000** | `gspe-app` |

### Keunggulan Arsitektur Ini:
1. **Runner Terisolasi:** Push ke `staging` hanya ditangkap oleh runner staging. Runner production tidak akan terganggu.
2. **Database Terpisah:** Staging menggunakan database `gspe_staging`, sehingga migrasi eksperimental tidak merusak data produksi `gspe_deployment`.
3. **Port Berbeda:** Pengujian fitur staging dapat diakses live di `http://192.168.2.42:3001` tanpa mengganggu aplikasi produksi di `http://192.168.2.42:3000`.
4. **Notifikasi Spesifik:** Bot Discord secara cerdas menyebutkan nama environment (`Staging (Port 3001)` atau `Production (Port 3000)`) pada setiap embed rilis.

