/**
 * Skeleton loader — Orang 3 (Frontend 1)
 *
 * Dua varian: grid untuk katalog, article untuk halaman baca.
 * Struktur class-nya sengaja mirror komponen aslinya supaya tidak ada
 * "layout shift" saat data arrives.
 */

function shimmer(): string {
  return 'animate-pulse bg-neutral-200/70';
}

export function ArtikelGridSkeleton({ count = 6 }: { count?: number }): JSX.Element {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" aria-busy="true" aria-label="Memuat artikel">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden border border-neutral-100">
          <div className={`h-1.5 w-full ${shimmer()}`} />
          <div className="p-5">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className={`h-5 w-24 rounded-full ${shimmer()}`} />
              <div className={`h-3 w-16 rounded ${shimmer()}`} />
            </div>
            <div className={`h-4 w-full rounded mb-2 ${shimmer()}`} />
            <div className={`h-4 w-4/5 rounded mb-4 ${shimmer()}`} />
            <div className={`h-3 w-full rounded mb-1.5 ${shimmer()}`} />
            <div className={`h-3 w-11/12 rounded mb-4 ${shimmer()}`} />
            <div className="flex items-center gap-3 border-t border-neutral-100 pt-3">
              <div className={`h-3 w-28 rounded ${shimmer()}`} />
              <div className={`h-3 w-20 rounded ml-auto ${shimmer()}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ArtikelDetailSkeleton(): JSX.Element {
  return (
    <div className="max-w-3xl mx-auto space-y-6" aria-busy="true" aria-label="Memuat artikel">
      <div className="flex items-center gap-3">
        <div className={`h-6 w-28 rounded-full ${shimmer()}`} />
        <div className={`h-3 w-20 rounded ${shimmer()}`} />
      </div>
      <div className={`h-8 w-full rounded ${shimmer()}`} />
      <div className={`h-8 w-3/4 rounded ${shimmer()}`} />
      <div className="flex items-center gap-4 pb-5 border-b border-neutral-100">
        <div className={`h-9 w-9 rounded-full ${shimmer()}`} />
        <div className="space-y-2">
          <div className={`h-3 w-40 rounded ${shimmer()}`} />
          <div className={`h-3 w-28 rounded ${shimmer()}`} />
        </div>
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className={`h-3.5 w-full rounded ${shimmer()}`} />
          <div className={`h-3.5 w-full rounded ${shimmer()}`} />
          <div className={`h-3.5 w-2/3 rounded ${shimmer()}`} />
        </div>
      ))}
    </div>
  );
}
