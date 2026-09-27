/**
 * Type mirror dari skema GraphQL SiGizi.
 * Sumber: backend/internal/graphql/graph/schema.graphqls
 *
 * Sengaja memakai penamaan field yang sama persis dengan skema (camelCase),
 * berbeda dari DTO REST di `types/entities.ts` yang memakai snake_case.
 * Nullability mengikuti skema: gqlgen memarshall berdasarkan `.graphqls`
 * (field tanpa `!` boleh null), bukan berdasarkan struct Go di `models.go`.
 *
 * Berkas ini dipakai bersama Orang 4 (editor Bidan + dashboard review Dinkes).
 */

// ── Query ──────────────────────────────────────────────────────────────

export interface UserGQL {
  idUser: number;
  nama: string;
}

/** Node user ringkas — dipakai di daftar artikel (anti-overfetching). */
export interface UserRingkasGQL {
  nama: string;
}

export interface ArtikelGQL {
  idArtikel: number;
  judul: string;
  isiArtikel: string;
  kategori: string | null;
  statusArtikel: string;
  idPenulis: number;
  idVerifikator: number | null;
  penulis: UserGQL;
  verifikator: UserGQL | null;
  tanggalPublish: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ArtikelListItemGQL {
  idArtikel: number;
  judul: string;
  kategori: string;
  ringkasan: string;
  idPenulis: number;
  tanggalPublish: string;
  statusArtikel: string;
  /** Diisi lewat `penulis { nama }` — cukup untuk kartu katalog. */
  penulis: UserRingkasGQL;
}

export interface ArtikelPendingItemGQL {
  idArtikel: number;
  judul: string;
  idPenulis: number;
  penulis: UserRingkasGQL;
  createdAt: string;
  statusArtikel: string;
}

export interface PageInfoGQL {
  currentPage: number;
  perPage: number;
  total: number;
  lastPage: number;
}

export interface ArtikelListPayloadGQL {
  items: ArtikelListItemGQL[];
  meta: PageInfoGQL;
}

export interface ArtikelPendingPayloadGQL {
  items: ArtikelPendingItemGQL[];
  meta: PageInfoGQL;
}

// ── Mutation (dipakai Orang 4) ─────────────────────────────────────────

export interface CreateArtikelPayloadGQL {
  idArtikel: number;
  statusArtikel: string;
}

export interface ReviewArtikelPayloadGQL {
  idArtikel: number;
  statusArtikel: string;
  tanggalPublish: string | null;
}

// ── Input (dipakai Orang 4) ───────────────────────────────────────────

export interface CreateArtikelInputGQL {
  judul: string;
  isiArtikel: string;
  kategori?: string | null;
}

export interface UpdateArtikelInputGQL {
  judul?: string | null;
  isiArtikel?: string | null;
  kategori?: string | null;
}

export interface ReviewArtikelInputGQL {
  aksi: string;
  catatanReview?: string | null;
}

// ── Status artikel (dari enum status_artikel di DB) ────────────────────

export const STATUS_ARTIKEL = {
  DRAFT: 'Draft',
  MENUNGGU_VERIFIKASI: 'Menunggu Verifikasi',
  DIPUBLIKASIKAN: 'Dipublikasikan',
  DITOLAK: 'Ditolak',
  DIARSIPKAN: 'Diarsipkan',
} as const;

export type StatusArtikel = (typeof STATUS_ARTIKEL)[keyof typeof STATUS_ARTIKEL];
