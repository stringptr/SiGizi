/**
 * TabBarArtikel — segmented control sub-tab halaman `/artikel` — Orang 4
 *
 * Hanya dirender oleh ArtikelHub jika role punya lebih dari satu tab
 * (Bidan: Katalog + Artikel Saya; Dinkes: Katalog + Review Artikel).
 * Tamu/Kader/Ibu tidak melihat tab bar sama sekali.
 */
export interface TabArtikelDef {
  value: string;
  label: string;
}

interface TabBarArtikelProps {
  tabs: TabArtikelDef[];
  active: string;
  onChange: (value: string) => void;
}

export function TabBarArtikel({ tabs, active, onChange }: TabBarArtikelProps): JSX.Element {
  return (
    <div className="inline-flex bg-white border border-neutral-200 rounded-xl p-1 gap-1">
      {tabs.map((t) => {
        const aktif = t.value === active;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            aria-current={aktif ? 'page' : undefined}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              aktif
                ? 'bg-primary text-white shadow-sm'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
