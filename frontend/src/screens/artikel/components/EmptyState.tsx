/**
 * Empty & error state — Orang 3 (Frontend 1)
 *
 * Satu komponen untuk tiga kasus: katalog kosong, hasil filter tidak cocok,
 * dan artikel tidak ditemukan / gagal dimuat.
 */
import type { ReactNode } from 'react';
import { BookX, SearchX, ServerCrash, RefreshCw } from 'lucide-react';

type EmptyStateKind = 'kosong' | 'tidak-ditemukan' | 'filter-kosong' | 'error';

interface EmptyStateProps {
  kind: EmptyStateKind;
  onRetry?: () => void;
  children?: ReactNode;
}

const KONTEN: Record<EmptyStateKind, { icon: ReactNode; judul: string; pesan: string }> = {
  kosong: {
    icon: <BookX size={40} className="mx-auto text-neutral-300" />,
    judul: 'Belum ada artikel',
    pesan: 'Belum ada artikel yang dipublikasikan. Silakan kembali lagi nanti.',
  },
  'tidak-ditemukan': {
    icon: <BookX size={40} className="mx-auto text-neutral-300" />,
    judul: 'Artikel tidak ditemukan',
    pesan: 'Artikel yang Anda cari tidak tersedia atau sudah tidak dipublikasikan.',
  },
  'filter-kosong': {
    icon: <SearchX size={40} className="mx-auto text-neutral-300" />,
    judul: 'Tidak ada artikel yang cocok',
    pesan: 'Coba ubah filter kategori atau kata kunci pencarian Anda.',
  },
  error: {
    icon: <ServerCrash size={40} className="mx-auto text-red-300" />,
    judul: 'Gagal memuat artikel',
    pesan: 'Terjadi kesalahan saat mengambil data dari server.',
  },
};

export function EmptyState({ kind, onRetry, children }: EmptyStateProps): JSX.Element {
  const k = KONTEN[kind];

  return (
    <div className="text-center py-16 font-body">
      {k.icon}
      <p className="font-semibold text-neutral-600 mt-3">{k.judul}</p>
      <p className="text-sm text-neutral-400 mt-1 max-w-md mx-auto leading-relaxed">{k.pesan}</p>

      {onRetry && kind === 'error' && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 bg-primary hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <RefreshCw size={14} />
          Coba Lagi
        </button>
      )}

      {children}
    </div>
  );
}
