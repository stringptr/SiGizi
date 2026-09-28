/**
 * Dokumen query/mutation GraphQL — Orang 3 (Frontend 1) + Orang 4 (Frontend 2)
 *
 * Kontrak: backend/internal/graphql/graph/schema.graphqls
 *
 * Semua operasi dikirim lewat `gqlRequest` dari `src/lib/graphql.ts`.
 * Tanpa SDL tag `gql` (tidak ada Apollo/urql), query ditulis sebagai
 * template string biasa agar nol dependency tambahan.
 */

// ── Query (Orang 3) ────────────────────────────────────────────────────

/**
 * GET_ARTIKEL_LIST — katalog publik.
 *
 * Sengaja TIDAK meminta `isiArtikel`: halaman katalog hanya butuh judul,
 * ringkasan, kategori, tanggal, dan nama penulis. Backend juga tidak
 * mengirim field yang tidak diminta ke response (GraphQL overriding
 * over-fetching), meski repo SQL sudah mengambil `LEFT(isi_artikel, 200)`
 * untuk `ringkasan`.
 *
 * `penulis` diambil lewat DataLoader server
 * (internal/graphql/dataloader.go) sehingga 1 query `user_account`
 * untuk seluruh halaman, bukan satu query per baris.
 */
export const GET_ARTIKEL_LIST = /* GraphQL */ `
  query GetArtikelList($page: Int, $perPage: Int) {
    daftarArtikel(page: $page, perPage: $perPage) {
      meta {
        currentPage
        perPage
        total
        lastPage
      }
      items {
        idArtikel
        judul
        kategori
        ringkasan
        tanggalPublish
        statusArtikel
        penulis {
          nama
        }
      }
    }
  }
`;

/**
 * GET_ARTIKEL_DETAIL — halaman baca.
 *
 * `isiArtikel` berasal dari kolom TEXT dan berisi teks polos, bukan HTML,
 * jadi dirender sebagai teks React (bukan dangerouslySetInnerHTML).
 */
export const GET_ARTIKEL_DETAIL = /* GraphQL */ `
  query GetArtikelDetail($id: Int!) {
    artikel(id: $id) {
      idArtikel
      judul
      isiArtikel
      kategori
      statusArtikel
      tanggalPublish
      createdAt
      updatedAt
      penulis {
        idUser
        nama
      }
      verifikator {
        idUser
        nama
      }
    }
  }
`;

// ── Query (Orang 4 — editor Bidan & dashboard review Dinkes) ───────────

/**
 * GET_ARTIKEL_SEMUA — semua artikel (role ADMIN/SUPER_ADMIN).
 *
 * Dipakai tab "Artikel Saya" di `/artikel`: schema tidak punya filter
 * penulis, jadi daftar "artikel saya" didapat dengan memfilter `idPenulis`
 * di client terhadap `user.idUser` yang sedang login.
 *
 * `perPage` maksimal 100 (pagination.ValidatePerPage) — sama dengan
 * katalog Orang 3, jadi di atas 100 artikel total daftar akan terpotong.
 */
export const GET_ARTIKEL_SEMUA = /* GraphQL */ `
  query GetArtikelSemua($page: Int, $perPage: Int) {
    daftarArtikelSemua(page: $page, perPage: $perPage) {
      meta {
        currentPage
        perPage
        total
        lastPage
      }
      items {
        idArtikel
        judul
        kategori
        ringkasan
        idPenulis
        tanggalPublish
        statusArtikel
        penulis {
          nama
        }
      }
    }
  }
`;

/**
 * GET_ARTIKEL_PENDING — antrean artikel "Menunggu Verifikasi" (role DINKES).
 *
 * Berbeda dengan daftar Bidan, antrean ini di-filter oleh server dan
 * memakai paginasi server-side (`meta.lastPage`).
 */
export const GET_ARTIKEL_PENDING = /* GraphQL */ `
  query GetArtikelPending($page: Int, $perPage: Int) {
    daftarArtikelPending(page: $page, perPage: $perPage) {
      meta {
        currentPage
        perPage
        total
        lastPage
      }
      items {
        idArtikel
        judul
        idPenulis
        penulis {
          nama
        }
        createdAt
        statusArtikel
      }
    }
  }
`;

// ── Mutation (Orang 4) ─────────────────────────────────────────────────
// Semua mutation dikirim dengan `{ skipCache: true }` ke gqlRequest DAN
// diikuti `clearGraphQLCache()` supaya daftar yang di-cache 10 menit
// tidak menampilkan data basi setelah submit.

/**
 * CREATE_ARTIKEL — role ADMIN (Bidan/Kader/Dinkes).
 *
 * Backend (service.Create): Dinkes -> langsung "Dipublikasikan",
 * selain itu -> "Menunggu Verifikasi" + notifikasi ke Dinkes.
 */
export const CREATE_ARTIKEL = /* GraphQL */ `
  mutation CreateArtikel($input: CreateArtikelInput!) {
    createArtikel(input: $input) {
      idArtikel
      statusArtikel
    }
  }
`;

/**
 * UPDATE_ARTIKEL — role ADMIN.
 *
 * Backend (service.Update) menolak 403 bila bukan pemilik, atau bila
 * status bukan "Menunggu Verifikasi" untuk non-Dinkes. UI sudah
 * men-disable tombol edit di status lain, tapi error tetap ditangkap.
 */
export const UPDATE_ARTIKEL = /* GraphQL */ `
  mutation UpdateArtikel($id: Int!, $input: UpdateArtikelInput!) {
    updateArtikel(id: $id, input: $input) {
      idArtikel
      judul
      kategori
      statusArtikel
      updatedAt
    }
  }
`;

/**
 * REVIEW_ARTIKEL — role DINKES. `aksi`: "setujui" | "tolak".
 *
 * setujui -> Dipublikasikan + id_verifikator + tanggal_publish
 * tolak   -> Ditolak + catatanReview diteruskan ke backend
 */
export const REVIEW_ARTIKEL = /* GraphQL */ `
  mutation ReviewArtikel($id: Int!, $input: ReviewArtikelInput!) {
    reviewArtikel(id: $id, input: $input) {
      idArtikel
      statusArtikel
      tanggalPublish
    }
  }
`;

/** DELETE_ARTIKEL — role DINKES saja (Bidan mendapat 403 dari backend). */
export const DELETE_ARTIKEL = /* GraphQL */ `
  mutation DeleteArtikel($id: Int!) {
    deleteArtikel(id: $id)
  }
`;
