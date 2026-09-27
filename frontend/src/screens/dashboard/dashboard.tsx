/**
 * Dashboard — orchestrator
 */

import { useEffect, useState } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import type { Role } from '../../App';
import { apiGet } from '../../lib/api';
import { IbuWaliSection } from './sections/IbuWaliSection';
import { BidanKaderSection } from './sections/BidanKaderSection';
import { DinkesSection } from './sections/DinkesSection';

interface ArtikelItem {
  id_artikel: number;
  judul: string;
  kategori?: string;
  ringkasan?: string;
  nama_penulis?: string;
}

function ArtikelPreview(): JSX.Element {
  const [artikel, setArtikel] = useState<ArtikelItem[]>([]);

  useEffect(() => {
    apiGet<{ artikel: ArtikelItem[] }>('/artikel')
      .then((res) => setArtikel((res.artikel ?? []).filter(a => a.judul).slice(0, 4)))
      .catch(() => {});
  }, []);

  if (artikel.length === 0) return <></>;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-neutral-800 font-headline flex items-center gap-2">
          <BookOpen size={16} className="text-primary" />
          Artikel Edukasi Terbaru
        </h3>
        <a href="/artikel" className="text-xs text-primary font-semibold hover:text-primary-600 flex items-center gap-1">
          Lihat Semua <ChevronRight size={12} />
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {artikel.map((a) => (
          <a
            key={a.id_artikel}
            href={`/artikel/${a.id_artikel}`}
            className="bg-white rounded-xl border border-neutral-100 p-4 hover:shadow-md transition-shadow group"
          >
            <span className="text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {a.kategori || 'Edukasi'}
            </span>
            <h4 className="text-sm font-semibold text-neutral-800 mt-2 line-clamp-2 group-hover:text-primary transition-colors">
              {a.judul}
            </h4>
            {a.ringkasan && (
              <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{a.ringkasan}</p>
            )}
            {a.nama_penulis && (
              <p className="text-xs text-neutral-400 mt-2">{a.nama_penulis}</p>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

interface DashboardProps {
  currentRole: Role;
}

export default function Dashboard({ currentRole }: DashboardProps): JSX.Element {
  return (
    <div className="space-y-5 font-body text-neutral-800">
      {/* Role section */}
      {currentRole === 'Ibu/Wali' && <IbuWaliSection />}
      {(currentRole === 'Bidan' || currentRole === 'Kader Posyandu') && (
        <BidanKaderSection currentRole={currentRole} />
      )}
      {currentRole === 'Dinas Kesehatan' && <DinkesSection />}
      <ArtikelPreview />
    </div>
  );
}
