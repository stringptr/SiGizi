/**
 * Utilitas tampilan artikel — Orang 3 (Frontend 1)
 */

/**
 * Backend mengirim timestamp sebagai `::text` dari PostgreSQL, jadi formatnya
 * BUKAN ISO-8601:
 *   - `tanggal_publish` (kolom DATE)   -> "2026-08-29"
 *   - `created_at` / `updated_at` (TIMESTAMPTZ) -> "2026-07-02 13:45:45+07"
 *
 * `new Date("2026-07-02 13:45:45+07")` tidak portabel (spasi, bukan "T"),
 * jadi string dinormalkan dulu sebelum di-parse.
 */
function parseTanggal(value?: string | null): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Tanggal polos "YYYY-MM-DD" -> tambahkan waktu tengah malam lokal,
  // supaya tidak bergeser hari karena di-parse sebagai UTC.
  const tanggalSaja = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (tanggalSaja) {
    const [, tahun, bulan, hari] = tanggalSaja;
    return new Date(Number(tahun), Number(bulan) - 1, Number(hari));
  }

  // "YYYY-MM-DD HH:MM:SS+07" -> "YYYY-MM-DDTHH:MM:SS+07:00"
  // PostgreSQL menulis offset zona waktu dengan 2 digit saja ("+07"), sedangkan
  // ISO-8601/ES2015 mensyaratkan "±HH:MM". Tanpa langkah ini
  // `new Date(...)` menghasilkan Invalid Date.
  const denganOffsetPenuh = trimmed.replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  const parsed = new Date(denganOffsetPenuh);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Format tanggal panjang, contoh: "29 Agustus 2026". */
export function formatTanggalPanjang(value?: string | null): string {
  const date = parseTanggal(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/** Format tanggal pendek, contoh: "29 Agu 2026". */
export function formatTanggalPendek(value?: string | null): string {
  const date = parseTanggal(value);
  if (!date) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/** Waktu baca toddler ~200 kata/menit. Contoh: "3 Menit Baca". */
export function estimasiWaktuBaca(teks?: string | null): string {
  const jumlahKata = (teks ?? '').trim().split(/\s+/).filter(Boolean).length;
  if (jumlahKata === 0) return '< 1 Menit Baca';
  const menit = Math.max(1, Math.round(jumlahKata / 200));
  return `${menit} Menit Baca`;
}

/**
 * Pisahkan isi artikel menjadi paragraf.
 *
 * Kolom `isi_artikel` (TEXT) diisi bebas, jadi pemecah sadar baris kosong DAN
 * tanda baca. Pemecahan pada ". " dihindari karena akan memotong singkatan
 * seperti "dr. " atau "No. 3", sehingga baris kosong jadi pemisah utama.
 */
export function pecahParagraf(isi?: string | null): string[] {
  return (isi ?? '')
    .split(/\n\s*\n+/)
    .map((p) => p.replace(/\s*\n\s*/g, ' ').trim())
    .filter((p) => p.length > 0);
}

/** Slug stabil untuk warna gradien kartu, diturunkan dari kategori. */
export function hashKategori(kategori: string): number {
  let hash = 0;
  for (let i = 0; i < kategori.length; i++) {
    hash = (hash * 31 + kategori.charCodeAt(i)) % 360;
  }
  return hash;
}

/**
 * Bersihkan `ringkasan` untuk ditampilkan di kartu.
 *
 * PENTING: `ringkasan` bukan kolom terpisah. Backend mengembalikannya sebagai
 * `LEFT(a.isi_artikel, 200)` (backend/internal/feature/artikel/repository.go),
 * jadi string-nya terpotong PADA 200 KARAKTER dan sering berakhir di tengah
 * kalimat atau tengah kata. Dipotong ulang di batas kalimat terdekat supaya
 * kartu tidak menampilkan cuplikan menggantung.
 *
 * Konsekuensi lain: panjang `ringkasan` SELALU <= 200 karakter, sehingga
 * estimasi waktu baca TIDAK boleh dihitung dari nilai ini di kartu — hasilnya
 * selalu "1 Menit". Waktu baca dihitung dari `isiArtikel` penuh di halaman
 * detail saja.
 */
export function potongRingkasan(ringkasan?: string | null, maks = 200): string {
  const teks = (ringkasan ?? '').trim();
  if (!teks) return '';
  // Penting pakai `<` bukan `<=`: LEFT(x, 200) mengembalikan string yang
  // panjangnya PERSIS 200 saat artikel lebih panjang, jadi kasus batas ini
  // harus tetap diproses agar cuplikan menggantungnya dibersihkan.
  if (teks.length < maks) return teks;

  const potongan = teks.slice(0, maks);
  const batas = Math.max(
    potongan.lastIndexOf('. '),
    potongan.lastIndexOf('! '),
    potongan.lastIndexOf('? '),
  );
  if (batas > 40) return potongan.slice(0, batas + 1);

  const spasiTerakhir = potongan.lastIndexOf(' ');
  return `${spasiTerakhir > 40 ? potongan.slice(0, spasiTerakhir) : potongan}…`;
}

/* ── Kategori ────────────────────────────────────────────────────────── */

/**
 * `artikel.kategori` adalah VARCHAR(100) yang diisi bebas — bukan enum. Nilai
 * yang benar-benar ada di seed (D:\generatedata\csv_output\artikel.csv):
 *   Gizi | Penyakit | Tumbuh Kembang | Kehamilan | Imunisasi
 *
 * ≠ /edukasi yang memakai nilai dummy ('Gizi Ibu', 'Nutrisi Anak', 'Parenting').
 * Karena VARCHAR, peta ini hanya pemanis: nilai di luar peta tetap tampil dengan
 * warna turunan hash, dan daftar kategori di UI DITURUNKAN dari data yang
 * dimuat (lihat `turunkanKategoriList`), bukan dari konstanta.
 */
export interface WarnaKategori {
  bg: string;
  text: string;
  border: string;
}

const WARNA_KATEGORI: Record<string, WarnaKategori> = {
  Gizi: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Imunisasi: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
  Kehamilan: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Penyakit: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Tumbuh Kembang': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
};

const WARNA_FALLBACK: WarnaKategori[] = [
  { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  { bg: 'bg-lime-50', text: 'text-lime-700', border: 'border-lime-200' },
];

/** Nilai chip "Semua" (filter netral). */
export const SEMUA_KATEGORI = 'Semua';
/** Kelompok untuk artikel yang `kategori`-nya kosong/NULL. */
export const KATEGORI_LAINNYA = 'Lainnya';

export function warnaKategori(kategori?: string | null): WarnaKategori {
  const key = (kategori ?? '').trim();
  if (!key) return WARNA_FALLBACK[0];
  return WARNA_KATEGORI[key] ?? WARNA_FALLBACK[hashKategori(key) % WARNA_FALLBACK.length];
}

/**
 * Susun daftar kategori unik dari item yang sudah dimuat, diurutkan.
 * Kategori kosong/NULL dikelompokkan sebagai "Lainnya" supaya tidak hilang
 * dari filter.
 */
export function turunkanKategoriList(items: { kategori: string | null }[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    const key = item.kategori?.trim();
    set.add(key ? key : KATEGORI_LAINNYA);
  }
  return [SEMUA_KATEGORI, ...Array.from(set).sort((a, b) => a.localeCompare(b, 'id'))];
}
