/**
 * Katalog Artikel — route `/artikel` — Orang 3 (Frontend 1)
 *
 * Halaman publik (tanpa login): grid kartu artikel + filter kategori +
 * pencarian + paginasi. Data dari GraphQL query `daftarArtikel`.
 *
 * Berbeda dari `/edukasi` yang masih memakai REST dan menyediakan tombol
 * tulis/edit/verifikasi per role (scope Orang 4). Halaman ini read-only.
 */
import { Paginator } from '../../components/Paginator';
import { useArtikelKatalog } from './hooks/useArtikelKatalog';
import { ArtikelKatalogHero } from './components/ArtikelKatalogHero';
import { ArtikelKartu } from './components/ArtikelKartu';
import { FilterBar } from './components/FilterBar';
import { ArtikelGridSkeleton } from './components/ArtikelSkeleton';
import { EmptyState } from './components/EmptyState';

export default function ArtikelKatalog(): JSX.Element {
  const katalog = useArtikelKatalog();
  const { loading, error, totalTerfilter } = katalog;

  return (
    <div className="space-y-6 font-body text-neutral-800 max-w-7xl">
      {/* Page heading */}
      <div>
        <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
          Literasi Kesehatan Komunitas
        </p>
        <h2 className="text-2xl font-bold text-neutral-900 font-headline leading-tight">
          Artikel <span className="text-primary">Edukasi Gizi</span> untuk Ibu dan Anak
        </h2>
      </div>

      {/* Filter — disembunyikan saat loading/error supaya tidak ada chip kosong */}
      {!loading && !error && katalog.kategoriList.length > 1 && (
        <FilterBar
          kategoriList={katalog.kategoriList}
          kategoriAktif={katalog.kategoriAktif}
          onChangeKategori={katalog.gantiKategori}
          searchQuery={katalog.searchQuery}
          onChangeSearch={katalog.gantiSearch}
        />
      )}

      {loading && <ArtikelGridSkeleton count={6} />}

      {!loading && error && <EmptyState kind="error" onRetry={katalog.retry} />}

      {!loading && !error && totalTerfilter === 0 && (
        <EmptyState kind={katalog.adaFilterAktif ? 'filter-kosong' : 'kosong'} />
      )}

      {!loading && !error && totalTerfilter > 0 && (
        <>
          {katalog.heroItems.length > 0 && <ArtikelKatalogHero items={katalog.heroItems} />}

          {katalog.gridItems.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {katalog.gridItems.map((artikel) => (
                <ArtikelKartu key={artikel.idArtikel} artikel={artikel} />
              ))}
            </div>
          )}

          {/* Paginator menyembunyikan diri sendiri saat totalPages <= 1 */}
          <div className="bg-white rounded-2xl border border-neutral-100">
            <Paginator
              page={katalog.page}
              totalPages={katalog.totalPages}
              totalItems={katalog.totalTerfilter}
              pageSize={katalog.pageSize}
              onPageChange={katalog.gantiPage}
              rangeOffset={katalog.rangeOffset}
            />
          </div>
        </>
      )}
    </div>
  );
}
