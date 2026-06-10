# Bank Sampah Go-Green — Web App

Versi rapi dari website Bank Sampah Go-Green, dibangun ulang mengikuti **tiga flowchart**
(Masyarakat Umum, Nasabah, dan Karyawan). Situs berfungsi penuh tanpa server backend:
seluruh data (nasabah, harga, transaksi, drop-off) disimpan di **localStorage** browser,
yang berperan sebagai "database" tersimulasi.

---

## Cara menjalankan

1. Buka folder ini di VS Code.
2. Pasang ekstensi **Live Server**.
3. Klik kanan `index.html` → **Open with Live Server** (biasanya jalan di `http://127.0.0.1:5500`).

> Catatan: harus lewat Live Server / server lokal, jangan dibuka langsung lewat `file://`,
> agar localStorage konsisten antar halaman.

---

## Struktur file

```
index.html              Landing page publik  ← Flow Masyarakat Umum
daftar.html             Form pendaftaran nasabah
katalog-harga.html      Katalog harga (publik & Menu 2 Nasabah)
login.html              Gerbang login (Nasabah / Karyawan)
nasabah.html            Dashboard Nasabah    ← Flow Nasabah
karyawan.html           Dashboard Karyawan   ← Flow Karyawan
assets/
  css/app.css           Seluruh gaya tampilan (tema Go-Green)
  js/store.js           "Database" localStorage + sesi + QR + chatbot + topbar
README.md               Berkas ini
```

Hanya **2 file inti** yang dipakai bersama semua halaman: `assets/css/app.css` dan
`assets/js/store.js`. Mengubah harga, akun demo, atau teks chatbot cukup dilakukan di
bagian **SEED** pada `store.js`.

---

## Akun demo

| Peran     | ID         | PIN    |
|-----------|------------|--------|
| Nasabah   | `NSB-0001` | `1234` |
| Karyawan  | `KRY-0001` | `admin`|

Di halaman login ada tombol **Pakai** untuk mengisi otomatis. Karyawan juga punya tombol
**Scan FaceID (simulasi)**.

> Ingin mengulang dari data awal? Jalankan `GG.resetDB()` di Console browser, lalu refresh.

---

## Pemetaan ke flowchart

### 1. Flow Masyarakat Umum → `index.html` + `daftar.html`
Buka landing page → eksplorasi (Cara Kerja, Tentang, Kegiatan) → **Lihat Katalog Harga Publik**
→ **Peta Lokasi** (OpenStreetMap) → **Butuh Bantuan?** lewat **chatbot mengambang** di pojok
kanan bawah → klik CTA **Daftar Jadi Nasabah** → isi form → **Submit** → **Akun Berhasil Dibuat**
(menampilkan ID, PIN, dan QR Code) → tombol **Masuk ke Dashboard** (lanjut ke Flow Nasabah).

### 2. Flow Nasabah → `nasabah.html`
Login → **Dashboard Nasabah** (saldo real-time + QR) → **Pilih Menu**:
- **Menu 1 — Cek Saldo & Riwayat:** saldo real-time + riwayat transaksi.
- **Menu 2 — Katalog Harga:** daftar harga sampah terbaru.
- **Menu 3 — Presensi & Setor:** menampilkan **QR Code Nasabah**, lalu percabangan
  **"Karyawan ada di tempat?"**
  - **Ya** → tunjukkan QR ke karyawan → penimbangan oleh karyawan → **notifikasi saldo masuk**
    (muncul otomatis ketika saldo bertambah, termasuk antar-tab).
  - **Tidak** → taruh sampah di lokasi → **Lapor Drop-off** → **unggah foto bukti** → **kirim ke
    admin untuk verifikasi**.

### 3. Flow Karyawan → `karyawan.html`
Login (kredensial / FaceID) → **Dashboard Karyawan** → **Cek Koneksi IoT Timbangan** (indikator
hijau, bisa disimulasikan putus/sambung) → **+ Penerimaan Sampah Baru** → **Scan QR Code Nasabah**
(pilih dari daftar QR terdaftar) → **Taruh Sampah di Timbangan** → **Baca Timbangan (IoT)** yang
**mengisi berat otomatis** → **klik Grid Jenis Sampah** (harga dihitung otomatis = berat × harga/kg)
→ **Pop-up Konfirmasi Data** → **Simpan Data & Saldo** → **Data Tersimpan di Database** (saldo
nasabah bertambah & nasabah dapat notifikasi).

Bagian **Verifikasi Drop-off** di halaman yang sama menampilkan laporan setor mandiri dari nasabah
beserta fotonya; admin bisa menimbang lalu memverifikasi (saldo masuk) atau menolaknya.

---

## Mencoba alur lengkap antar peran

1. Buka **dua tab**: satu login sebagai **Nasabah** (`nasabah.html`), satu sebagai **Karyawan**
   (`karyawan.html`).
2. Di tab Karyawan: **Penerimaan Sampah Baru** → pilih `NSB-0001` → baca timbangan → pilih jenis →
   simpan.
3. Lihat tab Nasabah: **notifikasi saldo masuk** muncul dan saldo bertambah otomatis.

Untuk menguji drop-off: di tab Nasabah → Menu **Presensi & Setor** → **Tidak** → isi catatan +
unggah foto → kirim. Lalu di tab Karyawan, bagian **Verifikasi Drop-off**, proses laporannya.

---

## Catatan teknis

- **QR Code** dibuat sebagai pola deterministik dari ID nasabah (konsisten per-ID) untuk keperluan
  alur antar-halaman, bukan QR yang dipindai kamera nyata.
- **Timbangan IoT** disimulasikan: tombol "Baca Timbangan" menghasilkan berat acak yang menetap,
  meniru pembacaan sensor.
- **Foto drop-off** diperkecil otomatis (maks 600px) sebelum disimpan agar muat di localStorage.
- Foto/gambar dekoratif memakai emoji & CSS agar situs tetap utuh tanpa file gambar eksternal.
  Silakan ganti dengan foto asli organisasi bila diinginkan.
