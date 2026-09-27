/**
 * Dokumen query/mutation GraphQL — Orang 3 (Frontend 1)
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
