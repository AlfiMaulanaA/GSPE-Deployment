# 📘 Dokumentasi Lengkap Arsitektur CI/CD & Docker (NexaStore)

Dokumen ini menjelaskan secara menyeluruh bagaimana sistem **Continuous Integration & Continuous Deployment (CI/CD)**, **peran branch Staging vs Production**, **arsitektur kontainer Docker dengan Zero-Downtime Blue/Green Deployment**, **Automated Rollback**, **Trivy Container Security Scanner**, serta **panduan linting kode per folder** bekerja pada proyek ini.

---

## 🗺️ 1. Diagram Alur Kerja CI/CD (Staging: CI Only vs Production: Zero-Downtime Deploy)

```mermaid
flowchart TD
    subgraph Developer_Action [Developer Git Push]
        Dev_Staging[Push ke Branch: staging]
        Dev_Prod[Push ke Branch: main / master]
    end

    subgraph CI_Stage [Tahap Validasi CI - Semua Branch]
        Dev_Staging --> Verify[Stage 1: Verify & Test\n- Postgres Service Container\n- Lint ESLint, Typecheck tsc, Vitest Unit Test\n- Audit Critical Vuln\n- Build Standalone & Smoke Test HTML]
        Dev_Prod --> Verify

        Dev_Staging --> CodeQL[Stage 2: CodeQL SAST\n- Static Application Security Scan]
        Dev_Prod --> CodeQL

        Verify --> Gate{Lulus Semua Tes?}
        CodeQL --> Gate
    end

    subgraph Staging_Path [Jalur Branch Staging: CI Only]
        Gate -- Branch == staging (Lulus) --> Notify_Staging_Pass[Stage 6: Discord Notify ✅\n- Staging CI Passed\n- Kode Siap Di-merge ke Main]
        Gate -- Branch == staging (Gagal) --> Notify_Fail[Stage 6: Discord Notify ❌]
    end

    subgraph Production_Path [Jalur Branch Main: SemVer, Zero-Downtime Deploy & Rollback]
        Gate -- Branch == main (Lulus) --> SemVer[Stage 3: SemVer Version Tagging\n- anothrNick/github-tag-action\n- Hitung Tag Versi Baru v1.x.x otomatis]

        SemVer --> Build_Push[Stage 4: Build & Publish Container\n- Docker Buildx multi-stage\n- Build-Arg: APP_VERSION=v1.x.x\n- Embed Versi di UI Navbar & Footer\n- Tag :latest, :SHA, dan :v1.x.x\n- Push ke GHCR ghcr.io]

        Build_Push --> Approval[Gate: Manual Approval Review\n- Environment: production\n- Reviewer: @AlfiMaulanaA\n- Tombol: Review deployments -> Approve and deploy]

        Approval -- Disetujui (Approved) --> Runner_Prod[Stage 5: Zero-Downtime Deploy Script\n- Backup DB Otomatis: pg_dump ke .sql\n- Start Target Container: app_blue / app_green\n- Internal Healthcheck: wget polling]

        Runner_Prod --> HealthCheck{Container Baru Sehat?}

        HealthCheck -- Gagal --> Auto_Rollback[🔄 Automated Rollback!\n- Matikan Container Rusak\n- Container Lama Tetap Aktif\n- ZERO USER DOWNTIME]
        Auto_Rollback --> Notify_Fail

        HealthCheck -- Sukses --> Switch_Nginx[⚡ Zero-Downtime Switch\n- Migrasi DB: prisma db push\n- Update Nginx upstream.inc\n- Nginx Reload: 0.001s tanpa putus koneksi\n- Matikan Container Lama]

        Switch_Nginx --> Smoke_Prod[Stage 6: Smoke Test k6\n- Uji Latency & Health di Port 3000]

        Smoke_Prod -- Sukses --> Release_Notes[Stage 7: Publish GitHub Release\n- softprops/action-gh-release\n- Terbitkan Changelog & Release Resmi]
        Smoke_Prod -- Gagal --> Notify_Fail

        Release_Notes --> Notify_Prod_Pass[Stage 8: Discord Notify 🚀\n- Production Deployment Succeeded\n- Info Tag Versi Baru & Port 3000 Live]
        Approval -- Ditolak (Rejected) --> Notify_Fail
        Build_Push -- Gagal --> Notify_Fail
    end
```

---

## ⚙️ 2. Peran Masing-Masing Branch

| Branch | Peran / Fungsi | Alur Eksekusi CI/CD | Target Server Fisik |
| :--- | :--- | :--- | :--- |
| **`staging`** | **Garda Pengujian & Validasi (CI Only)** | Menjalankan seluruh test suite (Linting, TypeScript compile, Vitest unit test, Prisma migration test, Next.js build test, CodeQL security scan). | **Tidak menyentuh server fisik** (Aman dari bentrok port / downtime) |
| **`main`** / **`master`** | **Rilis Produksi (Continuous Deployment)** | Test CI $\rightarrow$ **SemVer Tagging** $\rightarrow$ Build Image (Embed Versi di UI) $\rightarrow$ **Approval Gate** $\rightarrow$ **Zero-Downtime Deploy & Auto-Rollback** $\rightarrow$ k6 Test $\rightarrow$ **GitHub Release**. | **Live di Port 3000** (`http://192.168.2.42:3000`) |

---

## 🚀 3. Rincian Step-by-Step Pipeline CI/CD (`deploy.yml`)

Pipeline didefinisikan pada [.github/workflows/deploy.yml](file:///.github/workflows/deploy.yml) dan terbagi menjadi tahapan berikut:

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

### 🔹 Tahap 3: Automatic SemVer Version Tagging (`tag-version`)
* **Kondisi:** Dijalankan **HANYA** saat push ke branch **`main`** atau **`master`** setelah verifikasi CI lolos.
* **Mekanisme Otomatis:**
  * Menggunakan `anothrNick/github-tag-action` untuk membaca pesan commit (*Conventional Commits*):
    * `fix: ...` ➔ Menaikkan versi **Patch** (contoh: `v1.0.0` ➔ `v1.0.1`).
    * `feat: ...` ➔ Menaikkan versi **Minor** (contoh: `v1.0.1` ➔ `v1.1.0`).
    * `BREAKING CHANGE:` ➔ Menaikkan versi **Major** (contoh: `v1.1.0` ➔ `v2.0.0`).
  * Pipeline menghasilkan output tag versi (contoh: `v1.0.1`) yang akan di-*pass* ke proses build kontainer dan tampilan UI.

### 🔹 Tahap 4: Build & Publish Container dengan Versi SemVer (`build-and-push`)
* **Kondisi:** Dijalankan setelah versi SemVer ditentukan.
* **Langkah-langkah:**
  1. Menggunakan **Docker Buildx** dengan platform target `linux/amd64`.
  2. Meneruskan build argument: `APP_VERSION=${{ needs.tag-version.outputs.version }}` sehingga nomor versi tertanam ke dalam kode Next.js (Navbar dan Footer).
  3. Memberi tag lengkap: `:latest`, `:<commit-sha>`, dan `:<semver-tag>` (misal `:v1.0.1`).
  4. Mengunggah image ke **GitHub Container Registry (GHCR)** di `ghcr.io/alfimaulanaa/gspe-deployment`.

### 🔹 Gate Khusus: Manual Approval Gate (`environment: production`)
* **Mekanisme:** Sebelum kontainer dideploy ke server fisik, GitHub Actions akan **berhenti sementara (PAUSE)** dengan status `Waiting for review`.
* **Reviewer:** Dibatasi hanya untuk reviewer yang ditentukan (akun GitHub `@AlfiMaulanaA`).
* **Cara Melakukan Approve:**
  1. Buka tab **Actions** di GitHub repository.
  2. Buka run pipeline yang sedang berjalan (akan ada tanda status kuning *Waiting for review*).
  3. Klik tombol **"Review deployments"**.
  4. Centang environment **production**, lalu klik tombol **"Approve and deploy"** (atau *Reject* jika ingin membatalkan).
* **Keuntungan:** Menghindari *accidental deployment* dan memberi Anda kontrol penuh kapan server produksi boleh di-update.

### 🔹 Tahap 5: Zero-Downtime Blue/Green Deploy & Automated Rollback (`scripts/deploy-production.sh`)
* **Kondisi:** Dijalankan setelah mendapat approval manual.
* **Lingkungan:** Runner `containment-server` di mesin fisik `192.168.2.42`.
* **Mekanisme Kerja:**
  1. **Automated DB Snapshot:** Sebelum migrasi skema tabel, runner otomatis membuat file backup database di `$HOME/GSPE-Deployment/backups/db-backup-$(date +%Y%m%d_%H%M%S).sql`.
  2. **Deteksi Active vs Target Container:** Runner mendeteksi container mana yang sedang melayani traffic (`gspe-app-blue` atau `gspe-app-green`). Versi baru akan diarahkan ke container yang sedang *idle* (lawannya).
  3. **Booting & Internal Health Check:** Image versi baru di-*pull* dan dijalankan pada target container dengan `APP_VERSION`. Runner melakukan *polling* internal `wget` ke port 3000 container baru selama 30 percobaan.
  4. 🔄 **Automated Rollback jika Gagal:** Jika container baru mengalami *crash / failure* saat booting, runner langsung mematikan target container baru, membatalkan deployment, dan **TIDAK MENGUBAH NGINX**. Container versi lama tetap melayani pengguna tanpa ada *downtime* sama sekali!
  5. ⚡ **Zero-Downtime Switch (Nginx Reload):** Jika container baru dinyatakan 100% sehat, database dimigrasi (`prisma db push`), pointer `upstream.inc` Nginx diarahkan ke container baru, dan Nginx me-reload konfigurasi dalam hitungan milidetik tanpa memutus koneksi pengguna yang sedang aktif.
  6. **Graceful Decommission:** Container versi lama dimatikan setelah Nginx sukses melayani traffic versi baru.
  7. **Disk Pruning:** Membersihkan image Docker usang (>72 jam).

### 🔹 Tahap 6: Post-Deployment Smoke Test (`smoke-test-production`)
* Menjalankan script **k6** ([loadtest/site.js](file:///loadtest/site.js)) langsung dari runner untuk menguji respon latency HTTP 200 di port **3000**.

### 🔹 Tahap 7: Publish GitHub Release (`publish-github-release`)
* Menggunakan `softprops/action-gh-release` untuk menerbitkan rilis resmi di GitHub lengkap dengan catatan perubahan (*auto-generated changelog*).

### 🔹 Tahap 8: CI/CD Notification (`notify` - Telegram Bot & Discord Webhook)
* Berjalan otomatis (`if: always() && github.event_name == 'push'`).
* **Multi-Channel Notification:** Mendukung pengiriman ke **Telegram Bot** (`TELEGRAM_BOT_TOKEN` & `TELEGRAM_CHAT_ID`) dan/atau **Discord Webhook** (`DISCORD_WEBHOOK`).
* **Untuk Branch `staging`:** Mengirimkan pesan hijau `✅ Staging CI Passed` jika semua test valid, atau merah `❌ Staging CI Failed` jika ada error.
* **Untuk Branch `main`:** Mengirimkan pesan rilis `🚀 Production Deployment Succeeded (Port 3000 - Zero-Downtime)` lengkap dengan nomor rilis SemVer (misal `Release: v1.0.1`), author, commit, dan link ke run logs.

---

## 🎨 4. Tampilan Versi Aplikasi pada Antarmuka (UI)

Versi aplikasi yang dihasilkan oleh sistem Semantic Versioning otomatis dimunculkan pada 2 lokasi di antarmuka web:

1. **Header / Navbar ([src/components/Navbar.tsx](file:///src/components/Navbar.tsx)):**
   * Di sebelah kanan logo `NEXASTORE`, terdapat *badge* elegan berwarna ungu/indigo yang menampilkan versi aktif (contoh: `v1.0.1`).
2. **Halaman Bawah / Footer ([src/app/page.tsx](file:///src/app/page.tsx)):**
   * Pada bagian footer paling bawah tercantum:  
     `NexaStore Management System · Version v1.0.1 · Zero-Downtime High Availability`

---

## 🔍 5. Panduan Linting & Validasi Kode (ESLint)

### ❓ "Apakah untuk cek lint itu bisa ke spesifik folder?"
**JAWABANNYA: BISA BANGET!**

Secara bawaan, ESLint dapat diarahkan langsung ke path folder atau file tertentu yang ingin Anda periksa tanpa harus memindai seluruh proyek.

### 📌 Cara Menggunakan Linting Spesifik Folder:

#### 1. Menggunakan Script Pintas `npm run` (Di `package.json`)
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

#### 2. Menggunakan Argumen CLI Langsung
```bash
# Memeriksa folder spesifik
npx eslint src/components/
npx eslint src/app/actions/

# Memeriksa file spesifik saja
npx eslint src/components/ProductCard.tsx

# Melewatkan folder argumen melalui npm run lint
npm run lint -- src/components/

# Melakukan perbaikan otomatis (auto-fix)
npx eslint src/components/ --fix
```

---

## 🐳 5. Bedah Arsitektur File Docker (`Dockerfile`)

Aplikasi menggunakan **Multi-Stage Build** 3 lapis untuk efisiensi ukuran image dan keamanan maksimal:

* **Stage 1 (`deps`):** Mengunduh dan men-cache `node_modules` menggunakan `npm ci`.
* **Stage 2 (`builder`):** Men-generate Prisma client, mem-bundle script seed via `esbuild`, dan mengompilasi Next.js dengan mode `output: "standalone"`.
* **Stage 3 (`runner`):** Image minimalis berbasis `node:22-alpine` yang hanya menyalin folder `.next/standalone` dan aset statis. Berjalan di bawah user non-root `nextjs` (UID 1001) untuk keamanan enterprise, menghasilkan ukuran image yang sangat ramping (~150MB).

---

## 📦 6. Bedah Orkestrasi Container (`docker-compose.yml`)

Arsitektur kontainer di server fisik (`192.168.2.42`) menggunakan arsitektur **Reverse Proxy + Blue/Green Isolation**:

```text
[ Browser / Client ] ───> [ Port 3000 (Host) ]
                                   │
                                   ▼
                    [ gspe-nginx (Reverse Proxy) ]
                      (Port 80 internal / conf.d)
                                   │
              ┌────────────────────┴────────────────────┐
              ▼ (Active Upstream)                       ▼ (Standby / Testing)
     [ gspe-app-blue:3000 ]                    [ gspe-app-green:3000 ]
     (Next.js Standalone)                      (Next.js Standalone)
              │                                         │
              └────────────────────┬────────────────────┘
                                   │
                                   ▼
                        [ gspe-db (PostgreSQL 16) ]
```

* **Container `gspe-nginx`:** Menangani port host **`3000:80`**, melakukan terminasi koneksi dan mem-proxy ke aplikasi aktif dengan buffer TCP dinamis.
* **Container `gspe-app-blue` & `gspe-app-green`:** Berjalan di port internal 3000 (tanpa expose port ke host), bergantian aktif saat deployment rilis baru.
* **Container `gspe-db`:** PostgreSQL 16 Alpine berjalan di port **`5432`** dengan healthcheck bawaan `pg_isready`.
* **Isolasi Kredensial:** Seluruh username dan password diambil langsung dari file terlindung `/home/containment/GSPE-Deployment/.env`.
* **Folder Backups:** Terletak di `/home/containment/GSPE-Deployment/backups` yang otomatis menyimpan snapshot database setiap kali rilis dilakukan.

---

## 🛠️ 7. Panduan Instalasi Self-Hosted Runner pada Server Fisik

Panduan lengkap, langkah demi langkah, dan panduan perintah praktis untuk memasang runner baru di server Ubuntu/Linux telah didokumentasikan secara khusus pada:  
👉 **[PANDUAN_INSTALLASI_RUNNER.md](file:///PANDUAN_INSTALLASI_RUNNER.md)**

### 📌 Ringkasan Cepat Pemasangan Runner (4 Langkah):
1. **Dapatkan Token Registrasi dari GitHub**:  
   Buka GitHub ➔ **Settings** ➔ **Actions** ➔ **Runners** ➔ Klik **New self-hosted runner** (OS: Linux, Arch: x64).
2. **Unduh & Ekstrak Runner Package**:
   ```bash
   mkdir -p ~/actions-runner && cd ~/actions-runner
   curl -o actions-runner-linux-x64-2.337.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.337.0/actions-runner-linux-x64-2.337.0.tar.gz
   tar xzf ./actions-runner-linux-x64-2.337.0.tar.gz
   ```
3. **Konfigurasi dengan Label Deployment**:
   ```bash
   ./config.sh --url https://github.com/AlfiMaulanaA/GSPE-Deployment \
     --token <TOKEN_GITHUB> \
     --name containment-server \
     --labels self-hosted,linux,X64,deployment,production \
     --work _work --unattended --replace
   ```
4. **Jalankan Sebagai Systemd Daemon (Auto-Start saat Server Reboot)**:
   ```bash
   sudo ./svc.sh install
   sudo ./svc.sh start
   sudo ./svc.sh status
   ```

---

## 📱 8. Panduan Telegram CLI Notifier (`scripts/telegram-cli.sh`)

Sistem dilengkapi utilitas CLI mandiri untuk mengirim pesan dari terminal lokal maupun server langsung ke Telegram.

### 📌 Cara Penggunaan:
1. **Kirim Pesan Sederhana:**
   ```bash
   ./scripts/telegram-cli.sh "Halo, server containment aktif."
   # atau via npm script:
   npm run telegram:send -- "Halo, server containment aktif."
   ```

2. **Kirim Pesan Terformat Profesional (Dengan Judul & Status):**
   ```bash
   ./scripts/telegram-cli.sh -t "DATABASE BACKUP" -m "Backup otomatis telah disimpan ke /backups." -s SUCCESS
   ```

3. **Pilihan Argumen (Flags):**
   * `-m, --message TEXT` : Isi pesan teks.
   * `-t, --title TITLE`  : Header judul pesan.
   * `-s, --status STATUS` : Label status (`SUCCESS`, `FAILED`, `INFO`, `WARNING`).
   * `-c, --chat-id ID`   : Custom chat ID tujuan (default: `TELEGRAM_CHAT_ID`).
   * `--silent`           : Kirim senyap tanpa membunyikan nada dering.
   * `-h, --help`         : Tampilkan panduan lengkap CLI.


