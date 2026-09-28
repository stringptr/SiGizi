/**
 * SectionReview — tab "Review Artikel" di route `/artikel` — Orang 4 (Frontend 2)
 *
 * Dashboard verifikasi Dinas Kesehatan:
 *   - antrean `daftarArtikelPending` (query Orang 1, role DINKES)
 *   - modal review -> mutasi `reviewArtikel` (Orang 2)
 *   - hapus -> mutasi `deleteArtikel` (Orang 2, role DINKES)
 *
 * Pengganti `screens/edukasi/sections/DinkesSection` + modal verifikasi
 * yang semula memakai REST `PATCH /artikel/{id}/review` & `DELETE /artikel/{id}`.
 *
 * Guard role ada di `ArtikelHub` (section hanya dirender untuk Dinkes yang
 * login); backend tetap penjaga final: 401/403 dari resolver.
 */
import { useState } from 'react';
import { Inbox, Eye, Trash2, Search } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useArtikelPending } from './hooks/useArtikelPending';
import { ModalReviewArtikel } from './components/ModalReviewArtikel';
import { ModalKonfirmasiHapus } from './components/ModalKonfirmasiHapus';
import { StatusArtikelBadge } from '../../components/StatusArtikelBadge';
import { EmptyState } from '../artikel/components/EmptyState';
import { Paginator } from '../../components/Paginator';
import { formatTanggalPanjang } from '../artikel/utils';
import type { ArtikelPendingItemGQL } from '../../types/graphql';

interface SectionReviewProps {
  /** Fetch antrean hanya saat tab aktif + penonton adalah Dinkes. */
  aktif: boolean;
}

export function SectionReview({ aktif }: SectionReviewProps): JSX.Element {
  const notify = useNotification();
  const hook = useArtikelPending(aktif);

  const [targetReview, setTargetReview] = useState<ArtikelPendingItemGQL | null>(null);
  const [targetHapus, setTargetHapus] = useState<ArtikelPendingItemGQL | null>(null);
  const [cari, setCari] = useState('');

  const setelahSelesai = (pesan: string) => {
    setTargetReview(null);
    setTargetHapus(null);
    notify.success(pesan);
    hook.reload();
  };

  // Pencarian hanya atas halaman yang dimuat (paginasi server-side).
  const q = cari.trim().toLowerCase();
  const terlihat = q
    ? hook.items.filter(
        (a) =>
          a.judul.toLowerCase().includes(q) || a.penulis.nama.toLowerCase().includes(q),
      )
    : hook.items;

  return (
    <div className="max-w-5xl font-body text-neutral-800 space-y-6">
      {/* Heading */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Dinas Kesehatan
          </p>
          <h2 className="text-2xl font-bold text-neutral-900 font-headline leading-tight">
            Review Artikel
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Setujui atau tolak artikel yang diajukan Bidan dan Kader.
          </p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari judul / penulis..."
            className="pl-8 pr-3 py-2 text-xs border border-neutral-200 rounded-xl w-60 focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white"
          />
        </div>
      </div>

      {/* Banner jumlah antrean — hanya setelah selesai memuat */}
      {!hook.loading && !hook.error && (
        <div
          className={`border rounded-xl px-4 py-3 flex items-center gap-2.5 text-sm ${
            hook.total > 0
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          <Inbox size={16} className="flex-shrink-0" />
          {hook.total > 0 ? (
            <span className="font-medium">
              Terdapat <strong>{hook.total}</strong> artikel menunggu verifikasi Anda.
            </span>
          ) : (
            <span className="font-medium">Tidak ada artikel yang menunggu verifikasi.</span>
          )}
        </div>
      )}

      {/* Daftar antrean */}
      {hook.loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-neutral-100 rounded-xl p-5 flex items-center gap-4 animate-pulse"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-neutral-200/70 rounded" />
                <div className="h-3 w-1/3 bg-neutral-200/70 rounded" />
              </div>
              <div className="h-8 w-20 bg-neutral-200/70 rounded-lg" />
            </div>
          ))}
        </div>
      ) : hook.error ? (
        <EmptyState kind="error" onRetry={hook.retry} />
      ) : hook.items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
          <Inbox size={44} className="mx-auto text-neutral-300" />
          <p className="font-semibold text-neutral-600 mt-3">Antrean kosong</p>
          <p className="text-sm text-neutral-400 mt-1">
            Belum ada artikel dari Bidan yang menunggu verifikasi.
          </p>
        </div>
      ) : terlihat.length === 0 ? (
        <div className="text-center py-14 bg-white rounded-2xl border border-neutral-100">
          <Search size={40} className="mx-auto text-neutral-300" />
          <p className="font-semibold text-neutral-600 mt-3">Tidak ada yang cocok</p>
          <p className="text-sm text-neutral-400 mt-1">
            Coba kata kunci lain pada pencarian di atas.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {terlihat.map((a) => (
            <div
              key={a.idArtikel}
              className="bg-white border border-neutral-100 rounded-xl p-4 sm:p-5 flex items-start sm:items-center gap-4 flex-wrap hover:border-primary/30 transition-colors"
            >
              <div className="flex-1 min-w-[220px]">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="font-semibold text-neutral-800 text-sm sm:text-base font-headline">
                    {a.judul}
                  </h3>
                  <StatusArtikelBadge status={a.statusArtikel} />
                </div>
                <p className="text-xs text-neutral-400 mt-1.5">
                  {a.penulis.nama} · Dikirim {formatTanggalPanjang(a.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setTargetReview(a)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-600 rounded-lg transition-colors"
                >
                  <Eye size={14} />
                  Tinjau
                </button>
                <button
                  onClick={() => setTargetHapus(a)}
                  title="Hapus artikel"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Paginator
        page={hook.page}
        totalPages={hook.lastPage}
        totalItems={hook.total}
        pageSize={hook.pageSize}
        onPageChange={hook.gantiPage}
      />

      {targetReview && (
        <ModalReviewArtikel
          artikel={targetReview}
          onClose={() => setTargetReview(null)}
          onSelesai={setelahSelesai}
        />
      )}

      {targetHapus && (
        <ModalKonfirmasiHapus
          idArtikel={targetHapus.idArtikel}
          judul={targetHapus.judul}
          onClose={() => setTargetHapus(null)}
          onSelesai={setelahSelesai}
        />
      )}
    </div>
  );
}
