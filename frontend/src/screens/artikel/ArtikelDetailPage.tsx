/**
 * Detail Artikel — route `/artikel/:id` — Orang 3 (Frontend 1)
 *
 * Halaman baca publik. Data dari GraphQL query `artikel(id)`, yang di sini
 * baru boleh meminta `isiArtikel` (beda dengan query katalog).
 */
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, User, Calendar, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { useArtikelDetail } from './hooks/useArtikelDetail';
import { ArtikelKategoriBadge } from './components/ArtikelKategoriBadge';
import { ArtikelDetailSkeleton } from './components/ArtikelSkeleton';
import { EmptyState } from './components/EmptyState';
import { STATUS_ARTIKEL } from '../../types/graphql';
import { estimasiWaktuBaca, formatTanggalPanjang, pecahParagraf } from './utils';

export default function ArtikelDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { artikel, loading, error, retry, notFound } = useArtikelDetail(id);

  if (loading) {
    return (
      <div className="max-w-7xl">
        <ArtikelDetailSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl">
        <Link
          to="/artikel"
          className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold font-body hover:text-primary-600 mb-5 transition-colors"
        >
          <ArrowLeft size={15} />
          Kembali ke Katalog
        </Link>
        {notFound ? (
          <EmptyState kind="tidak-ditemukan" />
        ) : (
          <EmptyState kind="error" onRetry={retry} />
        )}
      </div>
    );
  }

  if (!artikel) return <></>;

  const paragraf = pecahParagraf(artikel.isiArtikel);
  const tanggalTerbit = formatTanggalPanjang(artikel.tanggalPublish);
  const tanggalDibuat = formatTanggalPanjang(artikel.createdAt);
  const menungguVerifikasi = artikel.statusArtikel === STATUS_ARTIKEL.MENUNGGU_VERIFIKASI;

  return (
    <div className="max-w-3xl mx-auto font-body">
      <Link
        to="/artikel"
        className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold font-body hover:text-primary-600 mb-5 transition-colors"
      >
        <ArrowLeft size={15} />
        Kembali ke Katalog
      </Link>

      <article className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-br from-primary-600 to-primary-800 px-7 py-8">
          <div className="flex items-center gap-3 mb-4">
            <ArtikelKategoriBadge
              kategori={artikel.kategori}
              className="!bg-white/20 !text-white !border-white/30"
            />
            <span className="text-[11px] text-white/70">{artikel.statusArtikel}</span>
          </div>
          <h1 className="text-2xl font-bold text-white font-headline leading-snug">
            {artikel.judul}
          </h1>
        </header>

        {/* Metadata */}
        <div className="px-7 py-5 border-b border-neutral-100">
          <div className="flex items-center gap-4 flex-wrap text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <User size={13} className="text-primary flex-shrink-0" />
              <span className="text-neutral-700 font-semibold">{artikel.penulis.nama}</span>
            </span>
            {artikel.tanggalPublish && (
              <span className="flex items-center gap-1.5">
                <Calendar size={13} className="text-primary flex-shrink-0" />
                {tanggalTerbit}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-primary flex-shrink-0" />
              {estimasiWaktuBaca(artikel.isiArtikel)}
            </span>
            {artikel.verifikator && (
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-primary flex-shrink-0" />
                Diverifikasi {artikel.verifikator.nama}
              </span>
            )}
          </div>

          {menungguVerifikasi && (
            <div className="mt-4 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 text-xs leading-relaxed">
              <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
              <span>
                Artikel ini masih menunggu verifikasi Dinas Kesehatan, sehingga
                informasinya bersifat sementara.
              </span>
            </div>
          )}
        </div>

        {/* Isi — kolom TEXT, dirender sebagai teks React (bukan HTML) */}
        <div className="px-7 py-7">
          {paragraf.length === 0 ? (
            <p className="text-sm text-neutral-400 italic">Artikel ini belum memiliki isi.</p>
          ) : (
            <div className="text-[15px] text-neutral-700 leading-[1.8] space-y-4">
              {paragraf.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          <footer className="mt-8 pt-5 border-t border-neutral-100 text-[11px] text-neutral-400 space-y-1">
            <p>Dibuat: {tanggalDibuat}</p>
            {artikel.tanggalPublish && <p>Dipublikasikan: {tanggalTerbit}</p>}
          </footer>
        </div>
      </article>

      <div className="mt-6 flex items-center justify-center">
        <button
          onClick={retry}
          className="inline-flex items-center gap-2 text-xs text-neutral-400 hover:text-primary font-body transition-colors"
        >
          <RefreshCw size={12} />
          Muat ulang
        </button>
      </div>
    </div>
  );
}
