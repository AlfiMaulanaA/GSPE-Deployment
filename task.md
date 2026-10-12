DISCORD_WEBHOOK=https://discord.com/api/webhooks/1559057856211193909/ESverGOIZYkebpJ-8DCLyYQ2jCjFHfX8D8yvL1LH7n7kcfFNUuwd-U5Cft5JaIJViAFM

Dengan menggunakan model **2 branch utama (`main` dan `staging`) ditambah branch fitur/eksperimen (`$3+n`)**, alur **CI/CD (Continuous Integration / Continuous Deployment)** menjadi jauh lebih ringkas, namun menuntut disiplin yang lebih tinggi karena `staging` kini bertindak sebagai garda terdepan pengujian.

Berikut adalah rincian proses CI/CD di setiap jenis branch tersebut:

---

### 1. Branch Fitur / Tugas ($3+n$ / `feature/...` atau `fix/...`)

* **Fokus CI/CD:** Validasi mandiri (*Self-Validation*), pengujian kode individual, dan penjagaan kualitas sebelum kode bergabung.
* **Trigger (Pemicu):** Setiap kali ada aksi *push* ke branch fitur ($3+n$) atau saat dibuatnya *Pull Request* (PR) menuju branch `staging`.
* **Aksi Pipeline:**
* **Linting & Code Formatting:** Memastikan kode sesuai dengan standar penulisan tim.
* **Unit Testing & Build Verification:** Menjalankan tes komponen kecil dan memastikan branch tersebut bisa di-*build* tanpa error.
* **Preview Environment (Opsional):** Beberapa platform modern (seperti Vercel, Netlify, atau Docker preview) bisa membuat *temporary URL* khusus untuk PR tersebut, sehingga penguji bisa melihat tampilan fitur secara langsung sebelum di-*merge*.



---

### 2. Branch Staging (Pre-Production & Automated CD)

* **Fokus CI/CD:** Integrasi penuh (*Continuous Integration* tingkat lanjut) dan *Continuous Deployment* otomatis ke lingkungan *staging*.
* **Trigger (Pemicu):** Saat sebuah *Pull Request* dari branch fitur ($3+n$) **disetujui dan di-*merge*** ke branch `staging`.
* **Aksi Pipeline:**
* **Full Test Suite:** Menjalankan tes yang lebih berat, seperti *Integration Testing* dan *End-to-End (E2E) Testing* untuk memastikan gabungan semua fitur baru tidak merusak sistem yang ada.
* **Automated Build & Push:** Pipeline otomatis melakukan *build* artefak aplikasi (misalnya *Docker image*, file statis, atau kompilasi backend).
* **Auto-Deploy ke Staging Server:** Sistem secara otomatis mengirim kode tersebut ke server *staging* (lingkungan tiruan *production*). Tim QA, *Product Manager*, atau klien dapat langsung menguji aplikasi yang sudah terintegrasi penuh di sini.



---

### 3. Branch Main (Production & Controlled CD)

* **Fokus CI/CD:** Rilis yang aman, stabil, dan minim risiko ke pengguna akhir.
* **Trigger (Pemicu):** Saat terjadi *merge* dari `staging` ke `main` (biasanya melalui *Pull Request* khusus rilis, pembuatan *Git Tag*, atau persetujuan manual/*manual approval* dari *Lead/Tech Lead*).
* **Aksi Pipeline:**
* **Security & Vulnerability Scan:** Pengecekan keamanan terakhir terhadap dependensi atau kerentanan kode.
* **Production Build & Optimization:** Melakukan optimasi performa tingkat lanjut (minifikasi, kompresi aset, pengaturan environment variables produksi).
* **Auto-Deploy / Zero-Downtime Deployment:** Pipeline meluncurkan aplikasi ke server *production* utama yang diakses oleh pengguna nyata (menggunakan strategi seperti *rolling update* atau *blue-green deployment* agar aplikasi tidak *down* saat proses rilis).
* **Post-Deployment Notification & Monitoring:** Mengirim laporan sukses/gagal rilis ke platform komunikasi tim (seperti Telegram, Slack, atau Discord) serta mengaktifkan pemantauan error (*error tracking* seperti Sentry).



---

### Ringkasan Alur CI/CD (2 Branch + Feature)

```text
[Branch 3+n / Feature] ---> (CI: Lint, Unit Test, Build Check)
         │
         ▼ (Merge via Pull Request)
    [Staging]          ---> (CI/CD: Integration/E2E Test, Auto-Deploy ke Staging Server)
         │
         ▼ (Merge via Release PR / Manual Approval)
     [Main]            ---> (CD: Security Scan, Production Deploy, Notifikasi)

```

Dengan pola ini, proses otomatisasi menjadi lebih cepat karena Anda tidak perlu melewati tahap *development* server lagi. Kode dari fitur langsung diuji secara kolektif di lingkungan `staging` sebelum naik ke `main`.

Untuk membangun sistem **Post-Deployment Notification & Monitoring** (seperti mengirim notifikasi ke Telegram/Slack/Discord dan memantau *error tracking* menggunakan Sentry), Anda membutuhkan kombinasi beberapa tools, layanan, dan konfigurasi skrip.

Pembuatannya dibagi menjadi dua bagian utama: **Notification (Notifikasi Rilis)** dan **Error Tracking (Pemantauan Error)**. Berikut adalah teknologi dan cara pembuatannya:

---

### 1. Bagian Notifikasi (Deployment Notification)

Tujuannya adalah mengirim pesan otomatis ke grup Telegram, Slack, atau Discord begitu proses *deployment* ke server selesai (baik sukses maupun gagal).

* **Alat yang Digunakan:**
* **CI/CD Pipeline Tool:** GitHub Actions, GitLab CI, Jenkins, atau Bitbucket Pipelines (untuk mendeteksi kapan proses deploy selesai).
* **Webhook / Bot API:**
* **Telegram Bot API:** Membuat bot Telegram sederhana via *BotFather* untuk mengirim pesan HTTP POST ke chat ID grup.
* **Slack/Discord Webhook URL:** URL khusus yang disediakan Slack/Discord untuk menerima pesan teks/rich embed.


* **Scripting:** Bash script (`curl`) atau *Action* bawaan dari marketplace CI/CD.


* **Contoh Implementasi di GitHub Actions (untuk Telegram):**
Di dalam file YAML workflow GitHub Actions (`.github/workflows/deploy.yml`), Anda bisa menambahkan *step* paling akhir:
```yaml
- name: Send Telegram Notification on Success
  if: success()
  uses: appleboy/telegram-action@master
  with:
    to: ${{ secrets.TELEGRAM_CHAT_ID }}
    token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    message: |
      🚀 *Deployment Success!*
      Repository: ${{ github.repository }}
      Branch: main
      Commit: ${{ github.event.head_commit.message }}
      Author: ${{ github.actor }}

- name: Send Telegram Notification on Failure
  if: failure()
  uses: appleboy/telegram-action@master
  with:
    to: ${{ secrets.TELEGRAM_CHAT_ID }}
    token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
    message: |
      ❌ *Deployment FAILED!*
      Check the pipeline logs: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}

```



---

### 2. Bagian Error Tracking & Monitoring (Contoh: Sentry)

Tujuannya adalah menangkap *error* atau *exception* di aplikasi secara *real-time* saat aplikasi sedang digunakan oleh user di *production*, lalu melaporkannya ke dashboard (dan otomatis meneruskan notifikasi ke Telegram/Slack jika terjadi *error* baru).

* **Alat yang Digunakan:**
* **Sentry SDK:** Library resmi yang dipasang di dalam kode aplikasi Anda (mendukung hampir semua bahasa/framework seperti Next.js, Node.js, Python, React Native, Go, dll.).
* **Sentry Webhook / Integrasi Bawaan:** Fitur integrasi langsung dari Sentry untuk menyambungkan *alert rule* ke channel Slack atau Telegram.


* **Cara Pembuatannya di Sisi Aplikasi (Contoh di Backend Node.js / Express atau Next.js):**
1. **Install SDK:**
```bash
npm install --save @sentry/node

```


2. **Inisialisasi di Kode Utama:**
```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "YOUR_SENTRY_DSN_URL_HERE",
  environment: "production",
  tracesSampleRate: 1.0,
});

// Contoh penangkapan error otomatis pada endpoint/fungsi
try {
  // Logika kode Anda
} catch (error) {
  Sentry.captureException(error); // Mengirim error ke Sentry secara real-time
}

```


3. **Pengaturan Alert di Dashboard Sentry:**
* Masuk ke dashboard Sentry proyek Anda.
* Masuk ke menu **Alerts** $\rightarrow$ **Create Alert**.
* Atur aturan (misalnya: *Send a notification to Slack/Telegram when an issue is first seen*).





---

### Ringkasan Arsitektur Sistemnya

1. **Kode di-merge ke `main**` $\rightarrow$ Trigger **GitHub Actions** berjalan.
2. Proses *build* & *deploy* dijalankan ke server.
3. **Step Terakhir Pipeline:** Menggunakan *GitHub Action* untuk menembak API Telegram/Slack (Memberi tahu tim bahwa rilis sukses/gagal).
4. **Aplikasi Berjalan:** Ketika user menggunakan aplikasi dan terjadi *bug/crash*, **Sentry SDK** yang tertanam di aplikasi langsung mengirim laporan *stack trace error* ke server Sentry, yang kemudian meneruskan *alert* darurat ke grup chat tim Anda.

Apakah Anda ingin fokus merancang bagian notifikasi di CI/CD tertentu (seperti GitHub Actions), atau ingin mengintegrasikan Sentry ke dalam stack teknologi tertentu yang sedang Anda gunakan?

name: CI/CD Pipeline (Staging & Production)

on:
  push:
    branches:
      - staging
      - main

jobs:
  # ==========================================
  # TAHAP 1: TEST & BUILD CHECK (CI)
  # ==========================================
  test-and-lint:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Linter & Unit Tests
        run: npm run test:ci

  # ==========================================
  # TAHAP 2: DEPLOY KE STAGING (CD)
  # ==========================================
  deploy-to-staging:
    needs: test-and-lint
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Create Staging .env file
        run: |
          echo "NODE_ENV=staging" >> .env
          echo "PORT=3001" >> .env
          echo "DATABASE_URL=${{ secrets.STAGING_DATABASE_URL }}" >> .env
          echo "JWT_SECRET=${{ secrets.STAGING_JWT_SECRET }}" >> .env

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push Docker Image (Staging)
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/my-app:staging

      - name: Deploy to Staging Server via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_SERVER_HOST }}
          username: ${{ secrets.STAGING_SERVER_USER }}
          key: ${{ secrets.STAGING_SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/staging-app
            git pull origin staging
            docker pull ${{ secrets.DOCKER_USERNAME }}/my-app:staging
            docker compose -f docker-compose.staging.yml up -d --force-recreate

  # ==========================================
  # TAHAP 3: DEPLOY KE PRODUCTION (CD)
  # ==========================================
  deploy-to-production:
    needs: test-and-lint
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Create Production .env file
        run: |
          echo "NODE_ENV=production" >> .env
          echo "PORT=3000" >> .env
          echo "DATABASE_URL=${{ secrets.PROD_DATABASE_URL }}" >> .env
          echo "JWT_SECRET=${{ secrets.PROD_JWT_SECRET }}" >> .env

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push Docker Image (Production)
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_USERNAME }}/my-app:latest

      - name: Deploy to Production Server via SSH
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_SERVER_HOST }}
          username: ${{ secrets.PROD_SERVER_USER }}
          key: ${{ secrets.PROD_SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/production-app
            docker pull ${{ secrets.DOCKER_USERNAME }}/my-app:latest
            docker compose -f docker-compose.prod.yml up -d --force-recreate

      - name: Send Telegram Notification on Success
        if: success()
        uses: appleboy/telegram-action@master
        with:
          to: ${{ secrets.TELEGRAM_CHAT_ID }}
          token: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          message: |
            🚀 *PRODUCTION DEPLOYMENT SUCCESS!*
            Aplikasi berhasil diperbarui ke versi terbaru di server production.