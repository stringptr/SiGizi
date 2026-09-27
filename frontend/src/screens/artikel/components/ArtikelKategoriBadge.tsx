/**
 * Badge kategori artikel — Orang 3 (Frontend 1)
 *
 * File ini hanya mengekspor komponen (aturan react-refresh). Pemetaan warna
 * dan konstanta kategori ada di `../utils`.
 */
import { warnaKategori } from '../utils';

interface ArtikelKategoriBadgeProps {
  kategori?: string | null;
  className?: string;
}

export function ArtikelKategoriBadge({ kategori, className = '' }: ArtikelKategoriBadgeProps): JSX.Element {
  const label = (kategori ?? '').trim() || 'Umum';
  const warna = warnaKategori(kategori);

  return (
    <span
      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${warna.bg} ${warna.text} ${warna.border} border ${className}`}
    >
      {label}
    </span>
  );
}
