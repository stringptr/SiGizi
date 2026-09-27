/**
 * Smoke test logika murni Orang 3 — dijalankan sekali lewat `bun run`, tidak
 * ikut bundle produksi. Menguji hal yang paling rawan bug: parsing tanggal
 * PostgreSQL, estimasi waktu baca, pemecah paragraf, dan turunan kategori.
 *
 * Jalankan: bun run src/screens/artikel/utils.smoke.ts
 */
import {
  KATEGORI_LAINNYA,
  SEMUA_KATEGORI,
  estimasiWaktuBaca,
  formatTanggalPanjang,
  formatTanggalPendek,
  pecahParagraf,
  potongRingkasan,
  turunkanKategoriList,
  warnaKategori,
} from './utils';

let gagal = 0;

function cek(nama: string, aktual: unknown, diharapkan: unknown): void {
  const ok = JSON.stringify(aktual) === JSON.stringify(diharapkan);
  if (!ok) {
    gagal++;
    console.error(`  FAIL ${nama}`);
    console.error(`       aktual    : ${JSON.stringify(aktual)}`);
    console.error(`       diharapkan: ${JSON.stringify(diharapkan)}`);
  } else {
    console.log(`  ok   ${nama}`);
  }
}

console.log('formatTanggalPanjang');
cek('kolom DATE "2026-08-29"', formatTanggalPanjang('2026-08-29'), '29 Agustus 2026');
cek('TIMESTAMPTZ offset 2 digit -> +07:00', formatTanggalPanjang('2026-07-02 13:45:45+07'), '2 Juli 2026');
cek('null -> "-"', formatTanggalPanjang(null), '-');
cek('string ngawur -> "-"', formatTanggalPanjang('bukan tanggal'), '-');

console.log('formatTanggalPendek');
cek('kolom DATE', formatTanggalPendek('2026-08-29'), '29 Agu 2026');

console.log('estimasiWaktuBaca');
cek('kosong', estimasiWaktuBaca(''), '< 1 Menit Baca');
cek('null', estimasiWaktuBaca(null), '< 1 Menit Baca');
cek('pendek -> min 1', estimasiWaktuBaca('satu dua tiga'), '1 Menit Baca');
cek('400 kata -> 2 menit', estimasiWaktuBaca(Array(400).fill('kata').join(' ')), '2 Menit Baca');

console.log('pecahParagraf');
cek('pisah baris kosong', pecahParagraf('Satu.\n\nDua.'), ['Satu.', 'Dua.']);
cek('gabung baris dalam 1 paragraf', pecahParagraf('Satu\ndua\n\nTiga'), ['Satu dua', 'Tiga']);
cek('hanya whitespace -> []', pecahParagraf('   \n\n  '), []);

console.log('warnaKategori');
cek('kategori dikenal -> peta', warnaKategori('Gizi').text, 'text-emerald-700');
cek('kategori/null -> fallback', warnaKategori(null).bg, 'bg-teal-50');
cek('kategori tak dikenal -> deterministik', warnaKategori('Zzz').bg, warnaKategori('Zzz').bg);

console.log('potongRingkasan');
// Backend mengirim LEFT(isi_artikel, 200): string terpotong mentah, sering di
// tengah kalimat atau tengah kata. Teks di bawah disalin dari isi_artikel
// id=12 di seed, lalu dipotong pada 200 karakter seperti yang dilakukan SQL.
const ISI_ASLI =
  'Imunisasi adalah upaya pemberian vaksin untuk membentuk ketahanan tubuh terhadap penyakit tertentu. ' +
  'Di Indonesia, program imunisasi dasar lengkap meliputi HB-0, BCG, Polio, DPT-HB-Hib, dan MR. ' +
  'Imunisasi sangat penting untuk mencegah penyakit berbahaya seperti campak, polio, dan tuberkulosis.';
const ringkasanMentah = ISI_ASLI.slice(0, 200);
cek('input simulasi server = 200 karakter', ringkasanMentah.length, 200);
cek('200 karakter PERSIS tetap dibersihkan', potongRingkasan(ringkasanMentah),
  'Imunisasi adalah upaya pemberian vaksin untuk membentuk ketahanan tubuh terhadap penyakit tertentu. ' +
  'Di Indonesia, program imunisasi dasar lengkap meliputi HB-0, BCG, Polio, DPT-HB-Hib, dan MR.');
cek('pendek -> tidak diubah', potongRingkasan('Pendek.'), 'Pendek.');
cek('kosong -> ""', potongRingkasan(''), '');
cek('null -> ""', potongRingkasan(null), '');
cek('tanpa titik -> potong di spasi + ellipsis',
  potongRingkasan('a'.repeat(120) + ' ' + 'b'.repeat(120)),
  `${'a'.repeat(120)}…`);
cek('memakai maks kustom', potongRingkasan('Satu. Dua. Tiga.', 10), 'Satu. Dua.…');
// Tidak ada titik kalimat yang layak, dan spasi terdekat (<40) juga tidak
// dipakai -> potong tepat di batas maks, tambah ellipsis.
const tanpaTitik = 'Pendek sekali. ' + 'x'.repeat(200);
cek('tidak ada batas pisah yang layak -> potong tepat di maks',
  potongRingkasan(tanpaTitik), `${tanpaTitik.slice(0, 200)}…`);

console.log('turunkanKategoriList');
const items = [
  { kategori: 'Gizi' },
  { kategori: 'Imunisasi' },
  { kategori: 'Gizi' },
  { kategori: '  ' },
  { kategori: null },
  { kategori: 'Penyakit' },
];
// "Semua" selalu di depan; sisanya urut alfabetis (locale 'id', case-insensitive),
// jadi "Lainnya" (L) berada di antara "Imunisasi" (I) dan "Penyakit" (P).
cek('unik + urut + Semua di depan',
  turunkanKategoriList(items),
  [SEMUA_KATEGORI, 'Gizi', 'Imunisasi', KATEGORI_LAINNYA, 'Penyakit']);

if (gagal === 0) {
  console.log('\nSEMUA LULUS');
} else {
  // `throw` (bukan process.exit) supaya tidak butuh @types/node di tsconfig.
  throw new Error(`${gagal} test gagal`);
}
