/**
 * StatusArtikelBadge — chip status artikel — Orang 4 (Frontend 2)
 *
 * Nilai `statusArtikel` datang sebagai string dari enum PostgreSQL
 * `status_artikel` (backend/internal/infrastructure/jet/.../enum),
 * direplikasi di `types/graphql.ts` → STATUS_ARTIKEL.
 */
import { STATUS_ARTIKEL } from '../types/graphql';

const WARNA: Record<string, string> = {
  [STATUS_ARTIKEL.DRAFT]: 'bg-neutral-100 text-neutral-600 border-neutral-200',
  [STATUS_ARTIKEL.MENUNGGU_VERIFIKASI]: 'bg-amber-50 text-amber-700 border-amber-200',
  [STATUS_ARTIKEL.DIPUBLIKASIKAN]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [STATUS_ARTIKEL.DITOLAK]: 'bg-red-50 text-red-600 border-red-200',
  [STATUS_ARTIKEL.DIARSIPKAN]: 'bg-slate-100 text-slate-500 border-slate-200',
};

interface StatusArtikelBadgeProps {
  status: string;
  className?: string;
}

export function StatusArtikelBadge({ status, className = '' }: StatusArtikelBadgeProps): JSX.Element {
  const warna = WARNA[status] ?? 'bg-neutral-100 text-neutral-600 border-neutral-200';
  return (
    <span
      className={`inline-flex items-center border rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${warna} ${className}`}
    >
      {status}
    </span>
  );
}
