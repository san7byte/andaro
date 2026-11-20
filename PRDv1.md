# PRD: Aplikasi Web Running untuk Pemula

**Versi:** 1.0 (MVP) **Status:** Siap dikerjakan

## 1. Ringkasan

Aplikasi web ringan untuk membantu pelari pemula berlatih dengan konsisten dan aman. Fokus versi pertama: mencatat lari, dan menyediakan timer yang bisa dipakai saat berlari (stopwatch, countdown target, dan interval run-walk).

## 2. Tujuan dan Non-Tujuan

**Tujuan**

- Pengguna bisa mencatat setiap sesi lari dan melihat riwayatnya.
- Pengguna bisa berlari dengan panduan timer run-walk tanpa harus menghitung sendiri.
- Seluruh aplikasi berjalan di browser HP tanpa akun dan tanpa server.

**Non-tujuan (tidak dikerjakan di v1)**

- Pelacakan GPS dan peta.
- Akun, login, dan sinkronisasi antar perangkat.
- Fitur sosial, leaderboard, dan grafik yang rumit.

## 3. Pengguna

Pelari pemula (pengguna utama adalah pembuat aplikasi sendiri) yang berlari di rute sekitar rumah, memakai HP, dan butuh panduan sederhana. Contoh rute tetap: sekitar 3,4 km.

## 4. Fitur v1

### F1. Log Lari

Form untuk mencatat satu sesi lari dan daftar riwayat.

**Field:**

- Tanggal (default hari ini)
- Jarak dalam km (bisa diedit manual)
- Durasi (menit dan detik)
- Tingkat capek, skala 1-10
- Catatan singkat (opsional)
- Pace per km (dihitung otomatis dari jarak dan durasi, tidak diisi manual)

**Kriteria selesai:**

- Data tersimpan dan tetap ada setelah halaman di-refresh.
- Riwayat tampil urut dari yang terbaru.
- Entri bisa dihapus.
- Validasi: jarak dan durasi harus lebih dari 0.
- Ada tombol ekspor riwayat ke file JSON sebagai cadangan.

### F2. Stopwatch

Timer yang menghitung naik dari 0 dan berhenti saat pengguna menekan stop.

**Kriteria selesai:**

- Tombol Mulai, Jeda, Lanjut, dan Stop.
- Waktu tetap akurat walau tab sempat tidak aktif.
- Setelah Stop, pengguna bisa langsung membuka form log dengan durasi sudah terisi.

### F3. Timer Target (Countdown)

Timer menghitung mundur dari durasi target, misalnya 20 atau 30 menit.

**Kriteria selesai:**

- Pilihan cepat 20 dan 30 menit, serta input durasi kustom.
- Saat mencapai 0: bunyi dan getar (jika didukung perangkat).
- Bisa Jeda, Lanjut, dan Batal.
- Setelah selesai, form log terbuka dengan durasi terisi.

### F4. Timer Interval Run-Walk

Bergantian antara fase lari dan fase jalan, diulang beberapa putaran.

**Pengaturan:**

- Durasi lari (default 1 menit)
- Durasi jalan (default 2 menit)
- Jumlah putaran (default 8)

**Kriteria selesai:**

- Layar menampilkan fase saat ini (LARI atau JALAN) dengan jelas, sisa waktu fase, dan putaran ke berapa.
- Bunyi dan getar setiap pergantian fase.
- Bisa Jeda, Lanjut, dan Stop.
- Setelah selesai, form log terbuka dengan total durasi terisi.

## 5. Alur Pengguna

1. Buka aplikasi dan pilih mode: Stopwatch, Target, atau Run-Walk.
2. Mulai timer lalu berlari.
3. Timer selesai atau di-stop, lalu form log terbuka dengan durasi terisi.
4. Isi jarak dan tingkat capek, lalu simpan.
5. Lihat riwayat di halaman Log.

## 6. Spesifikasi Teknis

**Stack:** React dengan Vite. Tidak ada backend.

**Penyimpanan:** `localStorage`, berisi array JSON. Contoh bentuk satu entri:

```json
{
  "id": "uuid",
  "date": "2026-11-20",
  "distanceKm": 3.4,
  "durationSec": 2100,
  "effort": 6,
  "note": "Lutut agak pegal"
}
```

Pace dihitung saat ditampilkan: `durationSec / distanceKm`.

**Aturan teknis timer:**

- Hitung waktu dari selisih `Date.now()` terhadap waktu mulai. Jangan menambah angka per tick dengan `setInterval`, karena browser memperlambatnya saat tab tidak aktif.
- Pakai Screen Wake Lock API agar layar tetap menyala saat timer berjalan.
- Audio baru boleh diputar setelah ada sentuhan pengguna, jadi picu audio dari tombol Mulai.
- `navigator.vibrate` tidak ada di semua browser (misalnya iPhone), jadi bunyi tetap jadi notifikasi utama.
- Bungkus semua akses `localStorage` dengan try/catch.

**Struktur folder yang disarankan:**

```
src/
  components/   (Timer, IntervalSettings, RunForm, RunList)
  hooks/        (useTimer, useWakeLock, useRunLog)
  lib/          (pace.js, storage.js, format.js)
  App.jsx
```

## 7. Urutan Pengerjaan

| Tahap | Pekerjaan                                                                | Hasil             |
| ----- | ------------------------------------------------------------------------ | ----------------- |
| 1     | Setup Vite + React, layout dasar, navigasi antar halaman                 | Kerangka aplikasi |
| 2     | Log lari: form, validasi, simpan, riwayat, hapus, hitung pace            | F1 jalan          |
| 3     | Hook `useTimer` berbasis `Date.now()`, lalu stopwatch                    | F2 jalan          |
| 4     | Countdown target dengan bunyi dan getar                                  | F3 jalan          |
| 5     | Interval run-walk                                                        | F4 jalan          |
| 6     | Sambungkan timer ke log (durasi terisi otomatis), Wake Lock, ekspor JSON | Alur lengkap      |
| 7     | Uji di HP saat berlari sungguhan, perbaiki yang mengganggu               | v1 siap dipakai   |

## 8. Rencana Setelah v1

- Rute tersimpan (misalnya rute rumah 3,4 km), pilih rute lalu jarak terisi otomatis.
- Jadwal latihan pemula 8 minggu dengan checklist.
- Grafik progres jarak dan pace.
- Pindah ke Next.js dengan database jika butuh akun dan sinkronisasi.

## 9. Risiko dan Catatan

| Risiko                                    | Penanganan                                                    |
| ----------------------------------------- | ------------------------------------------------------------- |
| Timer web kurang andal saat layar dikunci | Wake Lock, dan uji langsung di HP sebelum dipakai             |
| Data hilang saat data browser dihapus     | Tombol ekspor JSON                                            |
| Terlalu banyak fitur sekaligus            | Kerjakan sesuai urutan tahap, jangan lompat                   |
| Rute 3,4 km terlalu berat untuk awal      | Pakai run-walk di seluruh rute, atau mulai dari sebagian rute |

## 10. Bahasa dan Rencana Migrasi ke TypeScript

v1 ditulis dengan **JavaScript**. Setelah v1 stabil dan sebelum fitur baru ditambahkan, kode dimigrasi bertahap ke **TypeScript**.

**Syarat mulai migrasi:** semua fitur F1 sampai F4 sudah jalan dan sudah dicoba di HP saat berlari.

**Langkah migrasi:**

1. Install `typescript`, buat `tsconfig.json`, dan aktifkan `allowJs: true` agar file `.js` dan `.ts` bisa berdampingan.
2. Definisikan tipe inti lebih dulu: `Run` (id, date, distanceKm, durationSec, effort, note) dan `TimerMode`.
3. Ubah file satu per satu dengan urutan `lib/`, lalu `hooks/`, lalu `components/`. Ekstensi berubah dari `.js` ke `.ts` dan dari `.jsx` ke `.tsx`.
4. Perbaiki error di setiap file, lalu commit. Satu commit untuk satu file atau satu kelompok kecil.
5. Nyalakan `strict: true` di akhir, setelah semua file selesai dipindah.

**Hal yang dijaga selama v1 supaya migrasi mudah:**

- Nama field data konsisten (selalu `distanceKm`, `durationSec`, dan seterusnya).
- Logika dipisah dari tampilan: fungsi seperti hitung pace dan format waktu berada di `lib/`.
- Pakai Git dengan commit kecil agar mudah mundur.
