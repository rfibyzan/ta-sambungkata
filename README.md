# SambungKata

Permainan sambung kata bahasa Indonesia berbasis Progressive Web App. Setiap kata baru diawali 2 huruf terakhir kata sebelumnya (buku, kursi, siang). Kata valid yang pernah kamu mainkan tersimpan di Kamusku, koleksi pribadi yang menampilkan kata yang belum ditemukan sebagai "???".

Tugas Akhir Praktikum Pemrograman Perangkat Bergerak (PPB) Ganjil 2026, Teknik Komputer UNDIP.

- Aplikasi (PWA): https://ta-sambungkata.vercel.app/
- API: https://tugasakhir-sambungkata.vercel.app/api (cek status di `/api/health`)

## Cara main

Kata harus ada di kamus, satu kata tanpa spasi, minimal 3 huruf, dan belum dipakai di game yang sama. Kata pembuka diambil acak dari kamus. Kalau tidak ada lagi kata yang bisa menyambung (kunci mati), pembuatnya dapat bonus dan rantai dimulai lagi dengan kata acak.

Ada dua mode:

- Solo: 60 detik untuk menyambung sebanyak mungkin. Jawaban salah memotong waktu 3 detik.
- Lawan Bot: bergantian 15 detik per giliran, kamu punya 3 nyawa. Salah jawab atau kehabisan waktu mengurangi 1 nyawa. Bot Mudah memilih kata pendek yang umum, Bot Sulit memilih kata yang akhirannya punya sedikit sambungan. Bot kalah kalau tidak menemukan kata.

| Aturan skor | Nilai |
|---|---|
| Setiap huruf | +1 |
| Kata baru masuk Kamusku | +5 |
| Jawab kurang dari 5 detik | +3 |
| Membuat kunci mati | +10 |
| Menang lawan bot | +20 |

Semua validasi kata dan perhitungan skor dilakukan di server. Waktu dihitung dari timestamp server, bukan dikirim oleh aplikasi.

## Fitur

- Game Solo dan Lawan Bot (Mudah, Sulit) dengan layar hasil berisi rincian skor dan kata baru.
- Kamusku: progres koleksi dari 10.000 kata, filter huruf awal, pencarian, paginasi yang bisa diketik, dan detail kata (makna, contoh, tanggal pertama ditemukan, berapa kali dipakai).
- Peringkat mingguan dan sepanjang masa per mode, dengan halaman detail pemain.
- Riwayat permainan: daftar game, rantai kata lengkap, dan hapus riwayat.
- Daily Quest: 3 quest per hari yang sama untuk semua pemain, berganti pukul 00.00 WIB. Progres terhitung otomatis saat bermain, hadiahnya XP. Level naik dari XP, dan streak bertambah kalau semua quest hari itu diklaim.
- Akun: daftar, masuk, ganti username dan foto profil (dipotong menjadi 256 x 256 di perangkat sebelum diunggah), statistik, dan halaman Tentang Aplikasi.
- PWA: bisa dipasang di HP, punya manifest, ikon, dan service worker.

## Halaman

| Route | Halaman |
|---|---|
| `/` | Beranda: statistik singkat, kata hari ini, quest hari ini |
| `/main` | Pilih mode, lalu layar game di `/main/:gameId` |
| `/main/hasil/:gameId` | Hasil game |
| `/kamus` | Kamusku |
| `/kamus/:kataId` | Detail kata |
| `/peringkat` | Peringkat |
| `/pemain/:userId` | Detail pemain |
| `/riwayat` | Riwayat permainan |
| `/riwayat/:gameId` | Detail game |
| `/quest` | Quest hari ini |
| `/quest/:id` | Detail quest |
| `/profil` | Profil, lalu `/profil/edit` untuk mengubahnya |
| `/tentang` | Tentang aplikasi |
| `/masuk` | Masuk dan daftar |

## Tech stack

Backend mengikuti Modul 1: Node.js 20 ke atas, Express 5 dengan ES Modules, `@supabase/supabase-js`, `cors`, `dotenv`, dan `nodemon` untuk pengembangan. Database PostgreSQL di Supabase, dengan fungsi SQL (RPC) untuk query berat seperti kata acak per awalan dan cek kunci mati. RLS aktif di semua tabel, dan hanya backend yang mengakses database memakai service role key.

Frontend: React 19, Vite 8, React Router 7, Axios, Tailwind CSS 4, lucide-react, dan `vite-plugin-pwa`.

Keduanya di-deploy ke Vercel.

## Struktur folder

```
ta-sambungkata/
├── backend/
│   ├── vercel.json
│   ├── supabase/         schema.sql dan seed_quest_templates.sql
│   ├── scripts/          build-kata.js, seed-kata.js, uji-e2e.js
│   ├── data/             kata.json (10.000 kata siap di-seed)
│   ├── test/                 tes node:test
│   └── src/
│       ├── index.js
│       ├── config/           supabaseClient.js, gameRules.js (semua konstanta skor dan waktu)
│       ├── middleware/       auth.js, errorHandler.js
│       ├── models/           query Supabase saja
│       ├── services/         logika game, bot, dan quest
│       ├── controllers/      request dan response
│       ├── routes/           pemetaan URL
│       └── utils/
└── frontend/
    ├── vercel.json
    ├── public/               ikon PWA
    └── src/
        ├── api/              axios.js dan satu file per resource
        ├── context/          AuthContext.jsx
        ├── components/
        ├── lib/              fungsi bantu dan tesnya
        └── pages/
```

## Menjalankan di komputer sendiri

Butuh Node.js 20 atau lebih baru dan sebuah project Supabase.

1. Siapkan database. Jalankan `backend/supabase/schema.sql` di SQL Editor Supabase, lalu `backend/supabase/seed_quest_templates.sql`. Isi tabel `kata` dengan `node scripts/seed-kata.js` dari folder `backend`; skrip ini memasukkan 10.000 kata dari `backend/data/kata.json` per 1.000 baris. Buat juga bucket Storage publik bernama `avatar` untuk foto profil.

2. Jalankan backend:

   ```bash
   cd backend
   cp .env.example .env      # isi SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
   npm install
   npm run dev               # http://localhost:3000/api
   ```

3. Jalankan frontend di terminal lain:

   ```bash
   cd frontend
   cp .env.example .env      # VITE_API_URL=http://localhost:3000/api
   npm install
   npm run dev               # http://localhost:5173
   ```

   Service worker hanya aktif di hasil build. Untuk mencoba PWA, jalankan `npm run build` lalu `npm run preview`.

4. Tes otomatis: `npm test` di folder `backend` dan di folder `frontend`.

### Environment variables

`backend/.env`

| Nama | Isi |
|---|---|
| `PORT` | Port lokal, bawaan `3000` |
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key, hanya untuk backend |
| `SUPABASE_ANON_KEY` | Anon key, dipakai untuk login lewat Supabase Auth dari backend |
| `CORS_ORIGIN` | Alamat frontend yang boleh memanggil API, misalnya `http://localhost:5173` |

`frontend/.env`

| Nama | Isi |
|---|---|
| `VITE_API_URL` | Alamat API, misalnya `http://localhost:3000/api` |

## Endpoint API

Semua di bawah `/api`. Endpoint bertanda 🔒 butuh header `Authorization: Bearer <access_token>` dari `/auth/login`. Error selalu berbentuk `{ "error": "pesan" }` dengan status code yang sesuai.

| Method | Path | Fungsi |
|---|---|---|
| GET | `/health` | Cek status API |
| POST | `/auth/register` | Daftar akun |
| POST | `/auth/login` | Masuk, mengembalikan access token dan refresh token |
| POST | `/auth/refresh` | Tukar refresh token dengan access token baru |
| GET 🔒 | `/auth/me` | Data user yang sedang masuk |
| GET | `/auth/cek-username?username=` | Cek apakah username masih tersedia |
| GET | `/kata?search=&huruf=&page=&limit=` | Daftar kata |
| GET | `/kata/random` | Kata hari ini, sama untuk semua pemain dan berganti setiap hari (WIB) |
| GET | `/kata/:id` | Detail kata |
| GET | `/users/:id` | Profil publik dan statistik |
| PUT 🔒 | `/users/:id` | Ubah `username` atau `avatar_url` (URL https atau null), hanya pemilik |
| PUT 🔒 | `/users/:id/avatar` | Unggah foto profil `{ "gambar": "data:image/webp;base64,..." }`, JPG, PNG, atau WebP, maksimal 200 KB |
| DELETE 🔒 | `/users/:id/avatar` | Hapus foto profil |
| GET 🔒 | `/users/:id/kamus?huruf=&search=&page=&limit=` | Kamusku: kata yang sudah ditemukan tampil lebih dulu, plus progres koleksi |
| GET 🔒 | `/users/:id/kamus/:kataId` | Detail kata milik user (tanggal ditemukan, jumlah dipakai) |
| POST 🔒 | `/games` | Mulai game `{ "mode": "solo" }` atau `{ "mode": "bot", "tingkat": "mudah" }` |
| POST 🔒 | `/games/:id/moves` | Kirim kata `{ "kata": "kursi" }`, balasannya valid atau tidak, poin, kata baru, balasan bot, dan quest yang selesai |
| PUT 🔒 | `/games/:id` | Selesaikan atau menyerah `{ "aksi": "menyerah" }` |
| GET 🔒 | `/games?page=` | Riwayat game |
| GET 🔒 | `/games/:id` | Detail game dan rantai kata |
| DELETE 🔒 | `/games/:id` | Hapus riwayat game |
| GET | `/leaderboard?mode=solo\|bot_mudah\|bot_sulit&periode=mingguan\|semua` | Peringkat |
| GET 🔒 | `/quests/today` | Quest hari ini dan progres user |
| GET 🔒 | `/quests/:id` | Detail quest, termasuk kata yang sudah terhitung |
| POST 🔒 | `/quests/:id/claim` | Klaim hadiah XP |

Di mode Lawan Bot, balasan bot memuat `jeda_ms`: lama bot "berpikir" ditambah waktu menampilkan katanya. Kata yang dikirim sebelum jeda itu selesai ditolak dengan status 409 tanpa mengurangi nyawa.

Contoh cepat dengan curl:

```bash
# masuk
curl -X POST https://tugasakhir-sambungkata.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kamu@contoh.com","password":"rahasia"}'

# mulai game solo, lalu kirim kata
curl -X POST https://tugasakhir-sambungkata.vercel.app/api/games \
  -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" \
  -d '{"mode":"solo"}'
curl -X POST https://tugasakhir-sambungkata.vercel.app/api/games/<game_id>/moves \
  -H "Authorization: Bearer <access_token>" -H "Content-Type: application/json" \
  -d '{"kata":"kursi"}'
```

## Deploy

Backend dan frontend masing-masing menjadi project Vercel terpisah. Root directory project backend adalah `backend` (sudah ada `vercel.json` untuk `@vercel/node`), dengan environment variables seperti tabel di atas. `CORS_ORIGIN` diisi alamat frontend produksi. Root directory project frontend adalah `frontend`, dengan `VITE_API_URL` diisi alamat API produksi. `frontend/vercel.json` mengarahkan semua route ke `index.html` supaya halaman seperti `/kamus/12` bisa dibuka langsung.

## Sumber data

Kamus berisi 10.000 kata dasar yang dipilih oleh `backend/scripts/build-kata.js` dari dua sumber:

- Makna dan contoh dari dataset KBBI ([bachors/KBBI.sql](https://github.com/bachors/KBBI.sql)). Hak cipta isi KBBI milik Badan Pengembangan dan Pembinaan Bahasa; dipakai untuk keperluan akademik nonkomersial.
- Daftar frekuensi kata bahasa Indonesia ([hermitdave/FrequencyWords](https://github.com/hermitdave/FrequencyWords), lisensi MIT) untuk memilih kata yang umum dipakai.

Hasilnya tersimpan di `backend/data/kata.json`. Untuk membangunnya ulang, jalankan `node scripts/build-kata.js` dari folder `backend`; dataset mentah diunduh ke `backend/scripts/.cache/` yang tidak ikut di-commit.

## Pembuat

Muhammad Rafi Byzanorva Ramadhan (21120124130070)
