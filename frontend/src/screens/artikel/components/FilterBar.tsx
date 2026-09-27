/**
 * Filter kategori + pencarian — Orang 3 (Frontend 1)
 *
 * File ini hanya mengekspor komponen (aturan react-refresh). Konstanta dan
 * `turunkanKategoriList` ada di `../utils`.
 *
 * Query `daftarArtikel` belum menerima argumen filter kategori/pencarian di
 * backend, jadi filtering dilakukan client-side (lihat ../utils.ts).
 */
import { Search, X } from 'lucide-react';
import { SEMUA_KATEGORI, warnaKategori } from '../utils';

interface FilterBarProps {
  kategoriList: string[];
  kategoriAktif: string;
  onChangeKategori: (k: string) => void;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
}

export function FilterBar({
  kategoriList,
  kategoriAktif,
  onChangeKategori,
  searchQuery,
  onChangeSearch,
}: FilterBarProps): JSX.Element {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {kategoriList.map((k) => {
        const aktif = k === kategoriAktif;
        const warna = k === SEMUA_KATEGORI ? null : warnaKategori(k);
        return (
          <button
            key={k}
            onClick={() => onChangeKategori(k)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              aktif
                ? 'bg-primary text-white shadow-sm'
                : warna
                  ? `${warna.bg} ${warna.text} ${warna.border} border hover:opacity-80`
                  : 'bg-white border border-neutral-200 text-neutral-600 hover:border-primary hover:text-primary'
            }`}
          >
            {k}
          </button>
        );
      })}

      <div className="ml-auto relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          placeholder="Cari artikel..."
          value={searchQuery}
          onChange={(e) => onChangeSearch(e.target.value)}
          className="pl-9 pr-9 py-2 bg-white border border-neutral-200 rounded-full text-sm text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-200 w-56 font-body"
        />
        {searchQuery && (
          <button
            onClick={() => onChangeSearch('')}
            title="Bersihkan pencarian"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
