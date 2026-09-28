/**
 * ArtikelHub — route `/artikel` — Orang 4 (Frontend 2)
 *
 * Orkestrator satu halaman untuk semua urusan artikel (pengganti pola
 * `/edukasi` lama yang satu halaman berisi section per role):
 *
 *   - tamu / Kader / Ibu-Wali : tanpa tab bar, langsung katalog
 *   - Bidan                   : tab Katalog | Artikel Saya
 *   - Dinkes                  : tab Katalog | Review Artikel
 *
 * Sub-tab memakai query `?tab=katalog|saya|review` (default katalog) supaya
 * deep-link dan redirect dari route lama (`/bidan/artikel`,
 * `/dinkes/review-artikel`) langsung mendarat di tab yang tepat.
 *
 * Katalog dirender apa adanya dari `ArtikelKatalog` (karya Orang 3 — tidak
 * disentuh); dua section lain karya Orang 4. Query dipilih per tab sesuai
 * kontrak backend: `daftarArtikel` (publik, hanya Dipublikasikan),
 * `daftarArtikelSemua` (ADMIN, semua status), `daftarArtikelPending` (DINKES).
 */
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ArtikelKatalog from '../artikel/ArtikelKatalog';
import { SectionArtikelSaya } from '../bidan-artikel/SectionArtikelSaya';
import { SectionReview } from '../dinkes-review/SectionReview';
import { TabBarArtikel, type TabArtikelDef } from './TabBarArtikel';

export default function ArtikelHub(): JSX.Element {
  const { isLoggedIn, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isBidan = Boolean(isLoggedIn && user?.role === 'Bidan');
  const isDinkes = Boolean(isLoggedIn && user?.role === 'Dinas Kesehatan');

  const tabs: TabArtikelDef[] = [
    { value: 'katalog', label: 'Katalog' },
    ...(isBidan ? [{ value: 'saya', label: 'Artikel Saya' }] : []),
    ...(isDinkes ? [{ value: 'review', label: 'Review Artikel' }] : []),
  ];

  // ?tab tidak dikenal atau role tidak berhak -> jatuh balik ke katalog
  // (tanpa halaman error; backend tetap penjaga final untuk data).
  const tabParam = searchParams.get('tab') ?? 'katalog';
  const tab = tabs.some((t) => t.value === tabParam) ? tabParam : 'katalog';

  const gantiTab = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'katalog') next.delete('tab');
    else next.set('tab', value);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      {tabs.length > 1 && (
        <div>
          <TabBarArtikel tabs={tabs} active={tab} onChange={gantiTab} />
        </div>
      )}

      {tab === 'katalog' && <ArtikelKatalog />}
      {tab === 'saya' && isBidan && <SectionArtikelSaya aktif />}
      {tab === 'review' && isDinkes && <SectionReview aktif />}
    </div>
  );
}
