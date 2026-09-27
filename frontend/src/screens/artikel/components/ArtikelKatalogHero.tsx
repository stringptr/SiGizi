/**
 * Hero katalog artikel — Orang 3 (Frontend 1)
 *
 * Satu kartu besar + dua kartu samping, mengikuti bahasa visual /edukasi.
 * Hanya dirender bila tersedia minimal 3 artikel, supaya tidak menyisakan
 * kolom kosong saat data sedikit.
 *
 * Seperti ArtikelKartu, tidak ada estimasi waktu baca: `ringkasan` dari server
 * adalah `LEFT(isi_artikel, 200)` sehingga tidak bisa dipakai untuk menghitung
 * waktu baca (lihat ../utils.ts).
 */
import { useNavigate } from 'react-router-dom';
import { User, ArrowRight } from 'lucide-react';
import type { ArtikelListItemGQL } from '../../../types/graphql';
import { ArtikelKategoriBadge } from './ArtikelKategoriBadge';
import { formatTanggalPendek, potongRingkasan } from '../utils';

interface ArtikelKatalogHeroProps {
  items: ArtikelListItemGQL[];
}

export function ArtikelKatalogHero({ items }: ArtikelKatalogHeroProps): JSX.Element | null {
  const navigate = useNavigate();
  const [utama, kedua, ketiga] = items;

  if (!utama) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Kartu utama */}
      <div
        onClick={() => navigate(`/artikel/${utama.idArtikel}`)}
        className="lg:col-span-2 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 cursor-pointer group hover:shadow-lg transition-shadow min-h-60 flex flex-col justify-end"
      >
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-3">
            <ArtikelKategoriBadge
              kategori={utama.kategori}
              className="!bg-white/20 !text-white !border-white/30"
            />
            <span className="text-[11px] text-white/70 font-body">
              {formatTanggalPendek(utama.tanggalPublish)}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-headline leading-snug mb-2 line-clamp-2">
            {utama.judul}
          </h2>
          {potongRingkasan(utama.ringkasan) && (
            <p className="text-white/80 text-sm line-clamp-2 mb-4 font-body leading-relaxed">
              {potongRingkasan(utama.ringkasan)}
            </p>
          )}
          <div className="flex items-center gap-4 text-white/70 text-xs">
            <span className="flex items-center gap-1 min-w-0">
              <User size={12} className="flex-shrink-0" />
              <span className="truncate">{utama.penulis.nama}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Kartu samping */}
      <div className="flex flex-col gap-4">
        {[kedua, ketiga].filter(Boolean).map((a) => (
          <div
            key={a.idArtikel}
            onClick={() => navigate(`/artikel/${a.idArtikel}`)}
            className="flex-1 bg-white rounded-2xl p-4 border border-neutral-100 cursor-pointer hover:shadow-md hover:border-neutral-200 transition-all group"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <ArtikelKategoriBadge kategori={a.kategori} />
              <span className="text-[11px] text-neutral-400 font-body flex-shrink-0">
                {formatTanggalPendek(a.tanggalPublish)}
              </span>
            </div>
            <h3 className="font-bold text-neutral-800 text-sm font-headline leading-snug mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
              {a.judul}
            </h3>
            {potongRingkasan(a.ringkasan) && (
              <p className="text-xs text-neutral-500 font-body line-clamp-2 mb-3 leading-relaxed">
                {potongRingkasan(a.ringkasan)}
              </p>
            )}
            <span className="text-xs text-primary font-semibold font-body inline-flex items-center gap-1">
              Baca Selengkapnya
              <ArrowRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
