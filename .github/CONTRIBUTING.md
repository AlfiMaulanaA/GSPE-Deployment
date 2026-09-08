# 🤝 Panduan Kontribusi Pengembang (Contributing Guidelines)

Terima kasih telah tertarik untuk berkontribusi pada proyek **GSPE Deployment / NexaStore**! Panduan ini dibuat untuk membantu Anda memahami tata cara dan standar kerja kolaborasi di proyek ini.

---

## 🚀 1. Persiapan Lingkungan Kerja (Setup Environment)
1. **Clone Repositori**:
   ```bash
   git clone https://github.com/AlfiMaulanaA/GSPE-Deployment.git
   cd GSPE-Deployment/dev1-lead
   ```
2. **Install Dependensi**:
   ```bash
   npm install
   ```
3. **Inisialisasi Database Prisma**:
   ```bash
   npx prisma generate
   ```

---

## 🌿 2. Aturan Penamaan Branch & Commit

### Penamaan Branch:
- `feature/<nama-fitur>` — Untuk penambahan fitur baru. Contoh: `feature/login-google`
- `fix/<nama-bug>` — Untuk perbaikan bug. Contoh: `fix/invalid-token`
- `docs/<nama-dokumen>` — Untuk pembaruan dokumen. Contoh: `docs/update-readme`

### Format Pesan Commit (Conventional Commits):
Gunakan pesan commit bermakna dengan awalan yang standar:
- `feat: ...` — Penambahan fitur baru.
- `fix: ...` — Perbaikan bug.
- `docs: ...` — Perubahan dokumentasi.
- `style: ...` — Perubahan format/CSS tanpa mengubah logika.
- `ci: ...` — Perubahan konfigurasi CI/CD atau `.github`.

---

## 🔄 3. Alur Pengajuan Pull Request (PR)
1. Selalu buat branch fitur baru dari branch `main` yang *up-to-date*.
2. Pastikan kode Anda lolos linter sebelum commit: `npm run lint`.
3. Push branch Anda dan buat **Pull Request** di GitHub.
4. Isi **Pull Request Template** secara lengkap.
5. Tunggu minimal **1 Approval Review** dari Team Lead (`@AlfiMaulanaA`) sebelum PR di-merge.
