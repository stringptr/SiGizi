/**
 * Kartu artikel untuk grid katalog — Orang 3 (Frontend 1)
 *
 * Read-only. Tidak ada tombol edit/hapus/verifikasi (itu scope Orang 4 di
 * /edukasi). Kartu menerima `ArtikelListItemGQL` — field `isiArtikel` memang
 * tidak ada di tipe ini, jadi halaman katalog tidak pernah memuat isi penuh.
 *
 * Catatan: TIDAK ada chip waktu baca di sini. `ringkasan` dari server adalah
 * `LEFT(isi_artikel, 200)`, jadi selalu max 200 karakter dan estimasi dari
 * komponen itu selalu "1 Menit" — menyesatkan. Waktu baca dihitung dari
 * `isiArtikel` penuh di halaman detail saja.
 */
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight } from 'lucide-react';
import type { ArtikelListItemGQL } from '../../../types/graphql';
import { ArtikelKategoriBadge } from './ArtikelKategoriBadge';
import { formatTanggalPendek, potongRingkasan, warnaKategori } from '../utils';

interface ArtikelKartuProps {
  artikel: ArtikelListItemGQL;
}

export function ArtikelKartu({ artikel }: ArtikelKartuProps): JSX.Element {
  const navigate = useNavigate();
  const warna = warnaKategori(artikel.kategori);
  const ringkasan = potongRingkasan(artikel.ringkasan);

  return (
    <article
      onClick={() => navigate(`/artikel/${artikel.idArtikel}`)}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-neutral-100 cursor-pointer hover:shadow-md hover:border-neutral-200 transition-all"
    >
      {/* Strip warna — API artikel tidak punya field gambar, jadi pakai garis
          yang diturunkan dari kategori agar tiap kategori konsisten. */}
      <div className={`h-1.5 w-full ${warna.bg}`} />

      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center justify-between gap-3 mb-3">
          <ArtikelKategoriBadge kategori={artikel.kategori} />
          <span className="text-[11px] text-neutral-400 font-body flex-shrink-0">
            {formatTanggalPendek(artikel.tanggalPublish)}
          </span>
        </div>

        <h3 className="font-bold text-neutral-800 font-headline text-[15px] leading-snug mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {artikel.judul}
        </h3>

        {ringkasan ? (
          <p className="text-xs text-neutral-500 font-body leading-relaxed line-clamp-3 mb-4 flex-1">
            {ringkasan}
          </p>
        ) : (
          <p className="text-xs text-neutral-400 font-body italic mb-4 flex-1">
            Klik untuk membaca isi artikel.
          </p>
        )}

        <div className="flex items-center gap-3 text-neutral-400 text-[11px] border-t border-neutral-100 pt-3">
          <span className="flex items-center gap-1 min-w-0">
            <User size={11} className="flex-shrink-0" />
            <span className="truncate">{artikel.penulis.nama}</span>
          </span>
          <ArrowRight
            size={13}
            className="flex-shrink-0 text-neutral-300 ml-auto group-hover:text-primary group-hover:translate-x-0.5 transition-all"
          />
        </div>
      </div>
    </article>
  );
}
