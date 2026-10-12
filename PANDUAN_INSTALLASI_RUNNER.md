# 🛠️ Panduan Lengkap Instalasi & Konfigurasi GitHub Actions Self-Hosted Runner

Panduan ini berisi instruksi langkah demi langkah (*step-by-step*) untuk menginstal, mendaftarkan, dan mengonfigurasi **GitHub Actions Self-Hosted Runner** pada server Linux fisik / on-premise (seperti server Containment `192.168.2.42`), agar server dapat menerima instruksi deployment otomatis dari pipeline GitHub Actions.

---

## 📋 1. Prasyarat Server Host

Sebelum memulai instalasi, pastikan server host memenuhi persyaratan berikut:

1. **Sistem Operasi**: Linux x86_64 (Ubuntu 20.04 / 22.04 / 24.04 LTS atau Debian).
2. **Paket Pendukung**: Terpasang `curl`, `tar`, `git`, `jq`, `sudo`.
3. **Docker & Docker Compose**: Sudah terinstal dan aktif.
4. **Izin Docker Non-Root**: User yang menjalankan runner harus masuk ke grup `docker` agar tidak membutuhkan password `sudo` saat mengeksekusi container:
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   # Uji coba
   docker ps
   ```

---

## 🔑 2. Mendapatkan Registration Token dari GitHub

Token registrasi diperlukan untuk mengautentikasi server Anda ke repositori GitHub:

1. Buka repositori Anda di browser:  
   👉 `https://github.com/AlfiMaulanaA/GSPE-Deployment`
2. Masuk ke menu: **Settings** ➔ **Actions** ➔ **Runners** (di sidebar kiri).
3. Klik tombol hijau **"New self-hosted runner"**.
4. Pilih:
   * **Runner image**: `Linux`
   * **Architecture**: `x64`
5. GitHub akan menampilkan string token registrasi (berlaku selama 1 jam).

> 💡 **Tips via GitHub CLI:**  
> Anda juga bisa mendapatkan token langsung dari terminal:
> ```bash
> gh api -X POST repos/AlfiMaulanaA/GSPE-Deployment/actions/runners/registration-token --jq .token
> ```

---

## 📥 3. Unduh & Ekstrak Runner Package

Masuk ke server host (misal via SSH) menggunakan user runner (contoh: `containment`), lalu jalankan:

```bash
# 1. Buat direktori kerja runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# 2. Unduh rilis GitHub Actions Runner terbaru (versi 2.337.0)
curl -o actions-runner-linux-x64-2.337.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.337.0/actions-runner-linux-x64-2.337.0.tar.gz

# 3. Ekstrak installer
tar xzf ./actions-runner-linux-x64-2.337.0.tar.gz
```

---

## ⚙️ 4. Konfigurasi & Pendaftaran Runner ke Repositori

Jalankan skrip `config.sh` dengan menyertakan **label khusus** yang dibutuhkan oleh workflow `deploy.yml`:

```bash
./config.sh \
  --url https://github.com/AlfiMaulanaA/GSPE-Deployment \
  --token <MASUKKAN_REGISTRATION_TOKEN_DARI_GITHUB> \
  --name containment-server \
  --labels self-hosted,linux,X64,deployment,production \
  --work _work \
  --unattended \
  --replace
```

### 🏷️ Penjelasan Label Penting:
Job `deploy-production` di [.github/workflows/deploy.yml](file:///.github/workflows/deploy.yml) menggunakan konfigurasi:
```yaml
runs-on: [self-hosted, linux, X64, deployment]
```
Maka runner **wajib** memiliki label `deployment` agar GitHub Actions tahu pekerjaan harus diarahkan ke server ini.

---

## 🚀 5. Jalankan Runner Sebagai Systemd Service (Auto-Start)

> ⚠️ **PERINGATAN:**  
> Jangan menjalankan runner hanya menggunakan `./run.sh` interaktif, karena proses akan mati ketika sesi terminal SSH ditutup! Pasang sebagai daemon background sistem (*systemd service*).

Di dalam direktori `~/actions-runner`, jalankan:

```bash
# 1. Pasang service ke sistem
sudo ./svc.sh install

# 2. Nyalakan service
sudo ./svc.sh start

# 3. Cek status service
sudo ./svc.sh status
```

Output status yang benar harus menunjukkan:  
`Active: active (running)`

Sekarang runner akan **otomatis menyala kembali** meskipun server di-reboot atau mati listrik!

---

## 🧰 6. Manajemen & Pemeliharaan Layanan Runner

Berikut adalah perintah-perintah praktis untuk mengelola runner:

| Kebutuhan | Perintah |
| :--- | :--- |
| **Cek Status Service** | `sudo ./svc.sh status` |
| **Restart Runner** | `sudo ./svc.sh restart` |
| **Hentikan Sementara** | `sudo ./svc.sh stop` |
| **Nyalakan Kembali** | `sudo ./svc.sh start` |
| **Lihat Log Real-time** | `journalctl -u actions.runner.* -f` |
| **Copot Pemasangan (Uninstall)** | `sudo ./svc.sh uninstall` |

---

## 🗑️ 7. Cara Menghapus Runner dari GitHub (Jika Ganti Server)

Jika Anda ingin memindahkan runner ke server lain atau menghapusnya:

1. Dapatkan token penghapusan (*removal token*):
   ```bash
   gh api -X POST repos/AlfiMaulanaA/GSPE-Deployment/actions/runners/remove-token --jq .token
   ```
2. Di server lama:
   ```bash
   cd ~/actions-runner
   sudo ./svc.sh stop
   sudo ./svc.sh uninstall
   ./config.sh remove --token <TOKEN_PENGHAPUSAN>
   ```

---

## ✅ 8. Verifikasi di GitHub UI

1. Buka tab **Settings** ➔ **Actions** ➔ **Runners** di GitHub repository.
2. Anda akan melihat runner bernama **`containment-server`** dengan indikator **hijau (Idle)** dan label:
   `[self-hosted, linux, X64, deployment, production]`.
3. Runner kini siap 100% menerima deployment otomatis! 🎯
