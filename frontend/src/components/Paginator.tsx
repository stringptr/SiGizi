import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginatorProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /**
   * Jumlah item yang ditampilkan di LUAR daftar ini (mis. kartu hero di
   * /artikel). Dipakai supaya nomor "Menampilkan x-y" tetap mengacu ke
   * posisi asli pada daftar. Default 0 = perilaku lama.
   */
  rangeOffset?: number;
}

export function Paginator({ page, totalPages, totalItems, pageSize, onPageChange, rangeOffset = 0 }: PaginatorProps) {
  if (totalPages <= 1) return null;

  const from = rangeOffset + (page - 1) * pageSize + 1;
  const to = Math.min(rangeOffset + page * pageSize, totalItems);

  const pages: (number | 'ellipsis')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('ellipsis');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('ellipsis');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-50">
      <p className="text-xs text-neutral-500">
        Menampilkan {from}-{to} dari {totalItems} entri
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`e-${i}`} className="text-neutral-400 text-sm px-1">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors ${
                page === p
                  ? 'bg-primary text-white'
                  : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-30 transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
