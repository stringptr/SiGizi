# Frontend GraphQL Client — Orang 3 (Frontend 1)

Dokumen ini adalah Serializer/Reference untuk bagian frontend yang dikerjakan
Orang 3: **GraphQL client**, **katalog artikel**, dan **halaman baca artikel**.

> **Tidak ada perubahan ke backend.** Semua temuan backend di bagian
> [Temuan untuk Orang 1/2](#temuan-untuk-orang-12) hanya DOKUMENTASI, belum
> diperbaiki.

---

## 1. Ringkasan

| Aspek | Nilai |
|---|---|
| Library GraphQL | **Tidak ada dependency baru** — custom wrapper di atas `fetch` |
| File client | `frontend/src/lib/graphql.ts` |
| Endpoint | `VITE_GRAPHQL_URL` → default `/graphql` |
| Route baru | `/artikel` (katalog), `/artikel/:id` (baca) |
| Akses | Publik, tanpa login |
| Backward compat | `/edukasi` **tidak diubah** — reader REST lamanya masih utuh |

> Branch ini hanya berisi sisi **reader** milik Orang 3. Halaman tulis
> (`/bidan/artikel`, `/dinkes/review-artikel`) dan penghapusan `/edukasi`
> adalah bagian Orang 4 dan tidak ikut di sini.

### File baru

```
frontend/src/lib/graphql.ts                       custom GraphQL client
frontend/src/types/graphql.ts                     mirror tipe schema
frontend/src/graphql/artikel.queries.ts           query artikel (list + detail)
frontend/src/screens/artikel/ArtikelKatalog.tsx  halaman /artikel
frontend/src/screens/artikel/ArtikelDetailPage.tsx halaman /artikel/:id
frontend/src/screens/artikel/utils.ts             format tanggal, paragraf, dll
frontend/src/screens/artikel/utils.smoke.ts       smoke test logika murni
frontend/src/screens/artikel/hooks/useArtikelKatalog.ts
frontend/src/screens/artikel/hooks/useArtikelDetail.ts
frontend/src/screens/artikel/components/ArtikelKategoriBadge.tsx
frontend/src/screens/artikel/components/ArtikelKartu.tsx
frontend/src/screens/artikel/components/ArtikelKatalogHero.tsx
frontend/src/screens/artikel/components/FilterBar.tsx
frontend/src/screens/artikel/components/ArtikelSkeleton.tsx
frontend/src/screens/artikel/components/EmptyState.tsx
```

### File yang diedit (semumimal mungkin)

| File | Perubahan |
|---|---|
| `src/lib/api.ts` | `clearCache()` ikut memanggil `clearGraphQLCache()` (+5 baris) |
| `src/components/Paginator.tsx` | props opsional `rangeOffset` (default 0 = perilaku lama) |
| `src/components/header.tsx` | judul `/artikel`, sembunyikan search global di halaman artikel |
| `src/components/sidebar.tsx` | nav item "Artikel", publik untuk semua role + guest |
| `src/screens/guest/GuestDashboard.tsx` | preview artikel → `/artikel/:id` |
| `src/App.tsx` | 2 route baru |

---

## 2. Kenapa tanpa library GraphQL?

`@apollo/client` / `urql` menambah ±40 kB dan memunculkan cache machinery
sendiri. Kebutuhan di sini kecil: POST satu endpoint, baca `errors[]`, masiva
cookie refresh. `fetch` + ~150 baris sudah cukup dan konsisten dengan
`src/lib/api.ts` yang sudah ada.

---

## 3. Client

```ts
import { gqlRequest, clearGraphQLCache, GraphQLError } from '@/lib/graphql';

const data = await gqlRequest<{ daftarArtikel: ArtikelListPayloadGQL }>(GET_ARTIKEL_LIST, {
  page: 1,
  perPage: 100,
});
```

| Aspek | Perilaku |
|---|---|
| Metode | `POST` dengan `content-type: application/json` |
| Credential | `credentials: 'include'` (cookie access/refresh ikut terkirim) |
| Timeout | 30 detik → `AbortController` |
| Retry | Tidak ada (idemponen, biarkan user menekan "Coba Lagi") |
| Cache | 10 menit, key = `query + JSON.stringify(variables)` |
| Invalidasi | `clearCache()` di `api.ts` juga mengosongkan cache GraphQL |
| Error | `errors[0].extensions.code` + `status` → `GraphQLError` |

### Sirkular import `api.ts` ⇄ `graphql.ts`

`graphql.ts` memakai `apiPost('/auth/refresh')`, sementara `api.ts` memanggil
`clearGraphQLCache()`. Keduanya saling impor.

**Aman** karena semua rujukan lintas modul terjadi **di dalam badan fungsi**,
tidak pernah saat modul dievaluasi, dan `clearGraphQLCache` adalah
`function` declaration (di-hoist). Kalau nanti tetap terasa smell, cara
bersihnya: keluarkan `BASE_URL` + primitive `postJSON` ke modul
`src/lib/http.ts` yang diimpor keduanya — **tidak dilakukan di commit ini**
karena menyentuh `api.ts` yang dipakai seluruh aplikasi.

---

## 4. Format data dari backend (yang perlu diketahui frontend)

### 4.1 `ringkasan` BUKAN kolom

`ringkasan` tidak ada di tabel `artikel`. Backend mengembalikannya sebagai:

```sql
LEFT(a.isi_artikel, 200) AS ringkasan   -- repository.go:53 & :101
```

Dampaknya ke UI:

1. Panjang `ringkasan` **selalu ≤ 200 karakter** → **estimasi waktu baca dari
   `ringkasan` selalu "1 Menit"**. Karena itu chip waktu baca **dihapus dari
   kartu/hero**, dan hanya dihitung di halaman detail dari `isiArtikel` penuh.
2. String terpotong mentah, sering di tengah kalimat/kata. `potongRingkasan()`
   memotong ulang di batas kalimat terakhir yang utuh.

### 4.2 Tanggal

Kolom di-cast ke `::text`, jadi formatnya **bukan** ISO-8601:

| Kolom | Tipe | Contoh output |
|---|---|---|
| `tanggalPublish` | `DATE` | `2026-08-29` |
| `createdAt` / `updatedAt` | `TIMESTAMPTZ` | `2026-07-02 13:45:45+07` |

Dua jebakan yang sudah ditangani `parseTanggal()`:

- `new Date("2026-07-02 13:45:45+07")` → `Invalid Date` (spasi, bukan `"T"`).
- Offset **2 digit** (`+07`) tidak valid ISO-8601; harus `+07:00`. Tanpa
  normalisasi ini, `createdAt` di footer artikel akan selalu tampil `"-"`.

Kolom `DATE` sengaja di-parse lewat konstruktor lokal (`new Date(y, m-1, d)`)
supaya tidak bergeser sehari karena di-parse sebagai UTC.

### 4.3 `kategori` adalah VARCHAR bebas

Tidak ada enum. Nilai yang ada di seed: `Gizi`, `Penyakit`, `Tumbuh Kembang`,
`Kehamilan`, `Imunisasi`.

Konsekuensi: **daftar kategori di UI diturunkan dari data yang dimuat**
(`turunkanKategoriList()`), bukan dari konstanta, dan kategori di luar peta
warna tetap tampil dengan warna turunan hash. `NULL`/kosong dikelompokkan
sebagai "Lainnya".

> Nilai kategori ini **berbeda** dari dummy di `/edukasi`
> (`'Gizi Ibu'`, `'Nutrisi Anak'`, `'Parenting'`), jadi mapping warna tidak
> bisa dipakai ulang dari sana.

---

## 5. Query yang dipakai

### `GET_ARTIKEL_LIST` → katalog

```graphql
query DaftarArtikel($page: Int!, $perPage: Int!) {
  daftarArtikel(page: $page, perPage: $perPage) {
    items { idArtikel judul ringkasan kategori tanggalPublish statusArtikel
            penulis { idUser nama } }
    meta { total page perPage totalPages }
  }
}
```

### `GET_ARTIKEL_DETAIL` → halaman baca

```graphql
query ArtikelDetail($id: Int!) {
  artikel(id: $id) {
    idArtikel judul isiArtikel ringkasan kategori statusArtikel
    tanggalPublish createdAt updatedAt
    penulis { idUser nama }
    verifikator { idUser nama }
  }
}
```

### Untuk Orang 4 (disiapkan, belum dipakai UI)

`src/graphql/artikel.queries.ts` juga berisi
`GET_ARTIKEL_PENDING` / `GET_ARTIKEL_BY_ID`, `CREATE_ARTIKEL`,
`UPDATE_ARTIKEL`, `VERIFY_ARTIKEL`, `REJECT_ARTIKEL`, `ARCHIVE_ARTIKEL`.

Semua memakai header `withAuth: true` supaya client otomatis mengirim cookie
access token. Dokumentasi lengkap ada di `docs-graphql/pembagian-tugas.md`.

---

## 6. Kenapa filter & paginasi di client?

`daftarArtikel(page, perPage)` **tidak menerima argumen kategori maupun
pencarian** di backend. Yang bisa dilakukan:

- ambil satu halaman besar (`perPage` maks **100**, dibatasi
  `pagination.ValidatePerPage`),
- filter + slice di client.

Konsekuensi yang harus disadari: **kalau jumlah artikel published lewat 100,
filter client-side tidak lagi mencakup seluruh data.** Kalau itu terjadi,
`daftarArtikel` perlu argumen filter di backend (lihat bagian temuan).

Layout: 3 artikel teratas dipin sebagai hero (hanya di halaman 1), grid
mem Pagination 9 per halaman. `Paginator` menerima `rangeOffset` supaya
nomor "Menampilkan x-y" tetap mengacu ke posisi asli.

---

## 7. Verifikasi

```bash
cd frontend
bun install
bun run build     # tsc -b && vite build  → LULUS
bun run lint      # 44 error + 6 warning, SEMUA pre-existing di file lain
bun run src/screens/artikel/utils.smoke.ts   # 24 test → LULUS
```

### Status lint

`bun run lint` **tidak** hijau, tetapi itu sudah kondisi awal repo. Yang
penting: **0 temuan di file Orang 3**.

| Berkas | Jumlah |
|---|---|
| `src/store/useAppStore.ts` | 11 |
| `src/hooks/useNotificationSSE.ts` | 5 |
| `src/screens/edukasi/*` | 6 |
| `src/screens/monitoring/*` | 8 |
| `src/screens/tindak-lanjut/*` | 7 |
| `src/screens/jadwal-imunisasi/*` | 2 |
| `src/screens/user-management/*` | 2 |
| `src/screens/notifikasi/components/useNotifikasi.ts` | 2 |
| `src/screens/guest/GuestDashboard.tsx` | 1 *(pre-existing: `interface {}` kosong)* |
| `src/context/*`, `src/lib/api.ts` | 3 *(pre-existing)* |

Semua error di atas adalah `react-hooks/set-state-in-effect`,
`react-refresh/only-export-components`, `@typescript-eslint/no-unused-vars`, dan
`preserve-caught-error` — pola yang sudah ada sebelum commit ini. Folder
`src/screens/edukasi/*` sengaja masih utuh di branch ini, jadi 6 masalah
pre-existing di sana ikut tersisa.

### Yang sudah diverifikasi ke backend sungguhan

Dulu bagian ini mencatat bahwa Docker daemon tidak berjalan sehingga query
tidak pernah dieksekusi. Sekarang **sudah dijalankan** — lihat
[§10](#10-cara-menjalankan-stack-lokal) untuk langkah setup dan tabel hasil
uji. Yang tersisa belum diverifikasi:

- Go module: `go build ./...` di host tetap tidak bisa dijalankan (Go tidak
  terpasang). Backend sudah terverifikasi lewat `docker compose build` +
  image yang sama running di container.
- Smoke test `utils.smoke.ts` tetap stateless: ia menguji `parseTanggal`,
  `potongRingkasan`, dan pagination tanpa menyentuh jaringan.

### Dua bug nyata yang tertangkap smoke test

1. **Offset 2 digit** — `parseTanggal` gagal pada `...+07` sehingga
   `createdAt` selalu `"-"`. Diperbaiki dengan normalisasi ke `+07:00`.
2. **`potongRingkasan` mati** — dicek `length <= 200`, padahal `LEFT(x, 200)`
   mengembalikan **tepat 200** karakter, jadi cuplikan menggantung tidak pernah
   dibersihkan. Diperbaiki ke `length < 200`.

---

## 8. Temuan untuk Orang 1/2

Semua diverifikasi ulang terhadap source. **Belum ada yang diperbaiki.**

### 8.1 `artikel(id:)` MEMBOCORKAN artikel yang belum dipublikasikan

> **Status: sudah diverifikasi langsung ke backend yang sedang berjalan.**
> Klaim versi dokumen sebelumnya ("resolver PANIC / crash 500") **SALAH** —
> kode resolver ternyata sudah punya cabang `if detail != nil`. Yang benar
> adalah kebocoran datanya. Lihat [§8.1.1](#811-bukti-uji-langsung).

Resolver `Artikel` (`internal/graphql/schema.resolvers.go:18-68`) melakukan:

```go
article, err := repo.GetByID(ctx, int32(id))          // TIDAK filter status
if article == nil { return 404 }                      // hanya cek "ada", bukan "terbit"
detail, err := repo.GetDetailJoinByID(ctx, int32(id)) // filter 'Dipublikasikan'
...
a := &Artikel{ IDArtikel: int(article.IDArtikel), Judul: article.Judul,
               IsiArtikel: article.IsiArtikel, ... }  // ambil dari `article`, bukan `detail`
if detail != nil { /* isi tanggal dari detail */ } else { /* fallback ke article.CreatedAt */ }
```

Kunci masalahnya: seluruh field konten diambil dari `article` (hasil
`GetByID` yang **tanpa filter status**), sedangkan `detail` hanya dipakai
sebagai sumber tanggal dan punya cabang `else`. Jadi artikel yang belum terbit
tetap dikembalikan utuh — `Judul`, `IsiArtikel`, `Kategori`, dan `StatusArtikel`
semuanya bocor.

Harapan yang keliru: `GetDetailJoinByID` difilter `Dipublikasikan`, yang
diasumsikan otomatis menolak artikel lain. Tidak — `GetByID` sudah
membukanya duluan, dan `detail == nil` cuma dialihkan ke fallback, bukan
jadi 404.

#### 8.1.1 Bukti uji langsung

Backend dijalankan sungguhan (Docker, `localhost:8070`), request anonim:

| `id` | Status di DB | Hasil `artikel(id:)` |
|---|---|---|
| 9 | `Draft` | **200** — judul `"Manfaat Posyandu untuk Balita"` |
| 1 | `Menunggu Verifikasi` | **200** — judul `"Pencegahan Diare pada Anak"` |
| 12 | `Dipublikasikan` | 200 (benar) |
| 3 | `Ditolak` | **200** — judul `"Mengenal Tanda Bahaya Kehamilan"` |
| 4 | `Diarsipkan` | **200** — judul `"Jadwal Imunisasi Lengkap"` |

Tidak ada `errors[]` pada lima request tersebut. Bandingkan dengan endpoint
list `daftarArtikel` yang **benar** mengembalikan `total: 3` (hanya published)
untuk user anonim.

Perbandingan jalur REST: `Service.GetByID` (`service.go:120-126`) memakai
`GetDetailJoinByID` dan **sudah** menangani `row == nil` → 404 bersih. Jadi
ketidakkonsistenan ini hanya di lapisan GraphQL.

**Dampak ke frontend Orang 3:** `/artikel/:id` untuk id yang belum dipublikasikan
akan **menampilkan artikelnya**, bukan "tidak ditemukan". `useArtikelDetail`
hanya bisa menampilkan apa yang dikembalikan server, jadi halaman baca publik
jadi ikut membocorkan konten draft/ditolak/diarsipkan selama backend belum
diperbaiki. Ini regrettable karena katalog `/artikel` sendiri sudah aman.

**Perbaikan yang disarankan (Orang 1):** hapus pemanggilan `GetByID` dan
ambil `detail` saja, lalu `if detail == nil { return 404 }`. Itu satu
perubahan kecil dan sekaligus menutup kebocoran.

### 8.2 DAFTAR YANG SUDAH DIVERIFIKASI AMAN (koreksi)

Dokumen versi sebelumnya mengklaim *seluruh* jalur publik bocor. Itu
**berlebihan** — yang bocor hanya query `artikel(id:)`. Endpoint list aman:

| Jalur | Repository | Filter |
|---|---|---|
| GraphQL `daftarArtikel` | `GetAllPublished` | `WHERE status_artikel = 'Dipublikasikan'` (`repository.go:39`) |
| GraphQL `artikel(id)` | `GetDetailJoinByID` | `... AND status_artikel = 'Dipublikasikan'` (`:161`) |
| REST `GET /artikel` | `GetAllPublished` | `= 'Dipublikasikan'` (`:39`) |
| REST `GET /artikel/{id}` | `GetDetailJoinByID` | `= 'Dipublikasikan'` (`:161`) |

`daftarArtikelSemua` memang memakai `GetAll` **tanpa** filter, tetapi itu
 disengaja: resolver `schema.resolvers.go:120-126` mewajibkan role
`ADMIN`/`SUPER_ADMIN` sebelum query dijalankan.

### 8.3 Temuan lain

| # | Temuan | Lokasi | Catatan |
|---|---|---|---|
| 1 | `ringkasan` = `LEFT(isi_artikel, 200)`, bisa memotong tengah kata | `feature/artikel/repository.go:53,101` | Cukup untuk kartu, tapi cuplikan kadang menggantung. Sebaiknya kolom `ringkasan` sungguhan, atau `regexp_replace` + `…`. |
| 2 | Blacklist JWT tidak diperiksa | `graphql/middleware.go` | Logout tidak langsung mencabut access token yang sudah terbit. |
| 3 | Belum ada integration test untuk **read query** | `graphql/artikel.resolvers_integration_test.go` | Test yang ada hanya mutation. `daftarArtikel` & `artikel` belum diuji end-to-end - dan `artikel` persis jalur yang punya bug 8.1. |
| 4 | Kategori di seed tidak konsisten dengan judul | `artikel.csv` | id 12 "Jadwal Imunisasi Lengkap" → kategori `Kehamilan`; id 13 "Persiapan Persalinan Sehat" → `Imunisasi`. Isu data, bukan kode. |
| 5 | Dua query list beda urutan | `repository.go:59` vs `:107` | `GetAllPublished` urut `tanggal_publish DESC`, `GetAll` urut `created_at DESC`. Inkonsisten, tapi tidak salah. |

---

## 9. Catatan operasional

- `bun install` perlu dijalankan; `node_modules` awalnya tidak ada.
- Smoke test **tidak** ikut bundle produksi (tidak di-import siapa pun), tapi
  **tetap** di-typecheck oleh `tsc -b`.
- Filter kategori disembunyikan saat loading/error supaya tidak muncul chip
  kosong.
- Search bar global di header disembunyikan di `/artikel` karena halaman itu
  sudah punya pencarian sendiri.

---

## 10. Cara menjalankan stack lokal

Backend + database bisa dijalankan penuh di mesin ini. Ringkasnya:

```powershell
# 1. env (JWT_SECRET, kredensial DB, dll.) — .env sudah masuk .gitignore
Copy-Item .env.example .env

# 2. seed CSV — wajib, kalau tidak tabel artikel kosong
New-Item -ItemType Directory migrations\data -Force
Copy-Item D:\generatedata\csv_output\*.csv migrations\data\
#   migrations/data/*.csv juga sudah di-ignore (.gitignore:8)

# 3. database + migration (goose) + backend + NATS
docker compose --profile master  --profile migration up -d
docker compose --profile backend --profile information_system up -d
```

Yang perlu diketahui:

| Hal | Nilai |
|---|---|
| Postgres master | publish ke host **`localhost:55432`** (bukan 5432) |
| Backend | publish `8070:8080` → `http://localhost:8070` |
| NATS | **wajib** — backend gagal boot tanpa KV bucket `banned_ips` |
| Migration | `goose up`, 9 file, seed butuh `/data-csv/artikel.csv` |

### Catatan penting

1. **`MASTER_HOST_PORT` diganti ke `55432`.** Port 5432 di mesin ini dipakai
   dua service PostgreSQL native (`postgresql-x64-16` dan `-18`). Ini tidak
   masalah dengan backend: backend konek ke `master:5432` **di dalam** jaringan
   Docker, jadi port publish di host tidak memengaruhi apa pun. Yang berbeda
   hanya `psql` manual dari Windows.
2. **`vite.config.ts` sekarang baca `BACKEND_PROXY`.** Default tetap
   `http://backend:8080` (dipakai di dalam Docker), tapi saat vite dijalankan
   langsung di host:
   ```powershell
   $env:BACKEND_PROXY='http://localhost:8070'
   bun run dev
   ```
   Tanpa ini, `/graphql` balas **502** karena `backend` tidak resolve di luar
   jaringan Docker.
3. **`import { babel }` di `vite.config.ts` sudah rusak** (bukan hasil kerja
   bagian ini). `@rolldown/plugin-babel@0.2.3` hanya mengexport `default`
   (`babelPlugin`), sehingga `vite run` gagal dengan
   `does not provide an export named 'babel'`. Diperbaiki jadi default import
   pada commit `fix(frontend):` terpisah di branch ini — tanpa itu frontend
   tidak bisa dijalankan sama sekali.
4. **Download Go module sempat gagal** (`unexpected EOF` dari proxy.golang.org).
   Gejalanya build backend gagal padahal kodenya benar. Diperbaiki dengan
   `docker compose exec backend go mod download` sampai sukses, lalu restart.

### Hasil verifikasi (backend sungguhan)

| Uji | Hasil |
|---|---|
| `daftarArtikel` anonim | `total: 3` — hanya `Dipublikasikan` ✓ |
| Urutan | `tanggal_publish` DESC ✓ |
| `ringkasan` | `LENGTH(LEFT(isi_artikel,200)) = 200` ✓ |
| `artikel(id:12)` | 200, penulis + verifikator terisi ✓ |
| `createArtikel` (Bidan) | `id=21`, status `Menunggu Verifikasi` ✓ |
| `daftarArtikelPending` (Bidan) | `403 forbidden` ✓ |
| `daftarArtikelPending` (Dinkes) | 5 item, memuat artikel baru ✓ |
| `reviewArtikel` setujui (Dinkes) | `Dipublikasikan` + `tanggalPublish` terisi ✓ |
| `reviewArtikel` (Bidan) | `403 forbidden` ✓ |
| `createArtikel` anonim | `401 unauthorized` ✓ |
| `deleteArtikel` (Bidan) | `403 forbidden` ✓ |
| `deleteArtikel` (Dinkes) | `true` ✓ |
| `artikel(id:)` id unpublished | **200 — bocor**, lihat [§8.1](#81-artikelid-membocorkan-artikel-yang-belum-dipublikasikan) ✗ |

Baris bertanda ✓ adalah bagian Orang 3. Baris mutation ikut dicantumkan karena
dijalankan saat integrasi untuk memastikan bentuk `variables` di
`schema.graphqls` cocok dengan yang dikirim client — bukan bagian deliverable
branch ini.

Kredensial seed (`20260522040851_seed_login_accounts.sql`, password
`password123`): `admin@dinkes.test` (DINKES+SUPER_ADMIN), `bidan@test.com`
(BIDAN+ADMIN), `kader@test.com` (KADER+ADMIN).

---

## 11. Batas Branch Ini

Branch `feat/graphql-client-katalog-detail` berisi **hanya sisi reader**
(Orang 3), sesuai `pembagian-tugas.md` §4. Yang **tidak** ikut di sini:

| Yang belum ada | Pemilik | Spec |
|---|---|---|
| `/bidan/artikel` — form buat/edit | Orang 4 | `pembagian-tugas.md:106` |
| `/dinkes/review-artikel` — antrean review | Orang 4 | `pembagian-tugas.md:109` |
| Mutation `create/update/review/deleteArtikel` | Orang 4 | `pembagian-tugas.md:62` |
| Penghapusan folder `src/screens/edukasi/` (16 file) | Orang 4 | — |
| Slice `artikelList` di `useAppStore` dibuang | Orang 4 | — |

Konsekuensinya di branch ini:

- `/artikel` dan `/edukasi` **berdampingan sebagai dua halaman reader**.
  `/edukasi` masih reader REST + zustand seperti semula; `/artikel` reader
  GraphQL baru. Keduanya punya fungsi yang sama, jadi ini duplikasi sementara
  yang disengaja agar branch ini bisa direview dan dijalankan terpisah.
- `useAppStore.ts` dan `AuthContext.tsx` **tidak berubah sama sekali** di
  branch ini, karena slice `artikelList` masih dibutuhkan `/edukasi`.
- Penghapusan `/edukasi` + route `/bidan/artikel` + `/dinkes/review-artikel`
  baru terjadi di branch Orang 4, setelah branch ini di-merge.

Kalau yang kamu butuhkan justru versi "/edukasi sudah redirect ke /artikel",
itu bukan lagi branch Orang 3 — itu branch integrasi (Orang 3 + 4).
