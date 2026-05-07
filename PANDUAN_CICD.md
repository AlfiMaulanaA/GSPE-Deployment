# 🚀 Panduan Robot Otomatis (CI/CD) untuk Pemula
**Selamat!** Anda sekarang memiliki sistem pengiriman aplikasi otomatis. Panduan ini akan menjelaskan apa itu CI/CD dan bagaimana cara menggunakannya tanpa perlu menjadi ahli IT.

---

## 🤖 1. Apa itu CI/CD? (Analogi Sederhana)
Bayangkan Anda ingin mengirim kue ke rumah teman (Raspberry Pi) di kota lain.

*   **Dulu (Manual):** Anda harus membuat kue sendiri, membungkusnya, pergi ke terminal, naik bus, dan mengantarkannya sendiri. Jika ada kesalahan (lupa gula), Anda harus pulang dan mengulang semuanya dari awal. Melelahkan, bukan?
*   **Sekarang (CI/CD):** Anda cukup menulis resep di sebuah buku (GitHub). Begitu Anda selesai menulis, sebuah **Robot Ajaib** akan otomatis membacanya, membuatkan kuenya di pabrik, dan mengirimkannya langsung ke rumah teman Anda menggunakan drone. Anda cukup duduk manis di rumah.

---

## 🛠️ 2. Cara Mengupdate Website Anda
Mulai sekarang, setiap kali Anda ingin mengubah sesuatu di website (ganti warna, tambah menu, atau ganti harga), Anda hanya perlu mengikuti **3 Langkah Ajaib** ini di komputer Anda:

### Langkah Awal: Buka terminal di folder proyek Anda.

### Langkah 1: Kumpulkan Perubahan
Katakan pada komputer bahwa Anda ingin menyimpan semua perubahan yang baru saja Anda buat.
```bash
git add .
```

### Langkah 2: Beri Catatan
Beri nama pada perubahan Anda agar Anda ingat apa yang Anda lakukan (misalnya: "Ganti judul dashboard").
```bash
git commit -m "Ganti judul dashboard"
```

### Langkah 3: Kirim ke Robot (Push)
Ini adalah langkah paling penting. Perintah ini akan membangunkan "Robot Ajaib" di GitHub untuk mulai bekerja.
```bash
git push origin main
```

---

## 🕵️ 3. Bagaimana Cara Tahu Kalau Robot Sedang Bekerja?
Setelah Anda melakukan langkah ke-3 di atas, Anda bisa melihat si Robot bekerja dengan cara:
1.  Buka website **GitHub** di repository Anda.
2.  Klik menu **"Actions"** di bagian atas.
3.  Anda akan melihat daftar pekerjaan.
    *   🟡 **Kuning**: Robot sedang memasak (membangun aplikasi).
    *   ✅ **Hijau**: Robot sudah berhasil mengirimkan aplikasi ke Raspberry Pi.
    *   ❌ **Merah**: Ada kesalahan dalam resep (perlu bantuan teknis).

---

## 🌟 4. Kenapa Ini Keren?
1.  **Hemat Waktu**: Anda tidak perlu lagi masuk-keluar terminal Raspberry Pi yang rumit.
2.  **Anti-Salah**: Robot akan selalu mengikuti prosedur yang sama. Jika ada kode yang rusak, Robot akan memberitahu Anda sebelum aplikasi dikirim.
3.  **Bisa Dilakukan di Mana Saja**: Selama Anda punya internet, Anda bisa mengupdate website Anda dari belahan dunia mana pun.

---

## 📝 5. Catatan Penting
*   **Waktu Tunggu**: Robot butuh waktu sekitar 5-10 menit untuk bekerja (membangun dan mengirim). Jadi jangan panik jika website tidak langsung berubah sedetik setelah Anda mengetik perintah.
*   **Tetap Nyalakan Raspi**: Pastikan Raspberry Pi Anda terhubung ke internet agar bisa menerima paket dari si Robot.

---
**Selesai!** Sekarang Anda sudah bisa mengelola server canggih seperti seorang ahli profesional! 🎯
