/**
 * Daftar kategori artikel — Orang 4 (Frontend 2)
 *
 * Terpisah dari `EditorArtikel.tsx` supaya file komponen hanya mengekspor
 * komponen (eslint react-refresh/only-export-components).
 *
 * Nilai mengikuti kategori seed di migrations/data/artikel.csv — kolom
 * `kategori` adalah VARCHAR bebas (tidak ada enum di DB). 'Semua' sengaja
 * tidak ada: itu label filter, bukan kategori tulis.
 */
export const KATEGORI_PILIHAN = [
  'Gizi',
  'Imunisasi',
  'Kehamilan',
  'Penyakit',
  'Tumbuh Kembang',
] as const;

export type KategoriPilihan = (typeof KATEGORI_PILIHAN)[number];

export function isKategoriDikenal(kategori: string | null | undefined): kategori is KategoriPilihan {
  return Boolean(kategori) && (KATEGORI_PILIHAN as readonly string[]).includes(kategori as string);
}
