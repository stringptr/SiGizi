import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Baby, TrendingDown, BookOpen, ChevronRight, Clock, User, Target, AlertTriangle } from 'lucide-react';
import { apiGet } from '../../lib/api';
import type { PublicStatsResponse, PublicArtikelItem, PublicArtikelResponse } from '../../types/api';

interface GuestDashboardProps {
}

export function GuestDashboard(_props: GuestDashboardProps): JSX.Element {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PublicStatsResponse | null>(null);
  const [artikel, setArtikel] = useState<PublicArtikelItem[]>([]);

  useEffect(() => {
    apiGet<PublicStatsResponse>('/stats')
      .then((res) => setStats(res))
      .catch(() => {
        console.error('Gagal memuat statistik publik');
        setStats({
          total_pasien: 0,
          balita_dipantau: 0,
          kasus_stunting: 0,
          total_artikel: 0,
        });
      });
    apiGet<PublicArtikelResponse>('/artikel')
      .then((res) => setArtikel((res.artikel ?? []).slice(0, 3)))
      .catch(() => console.error('Gagal memuat artikel publik'));
  }, []);

  const publicStats = stats
    ? [
        { icon: <Users size={22} />, label: 'Total Pasien Terdaftar', value: stats.total_pasien.toLocaleString('id-ID'), delta: 'Terdaftar di sistem', color: 'bg-primary text-white' },
        { icon: <Baby size={22} />, label: 'Balita Dipantau', value: stats.balita_dipantau.toLocaleString('id-ID'), delta: 'Aktif di 35 kab/kota', color: 'bg-blue-600 text-white' },
        { icon: <TrendingDown size={22} />, label: 'Kasus Stunting', value: stats.kasus_stunting.toLocaleString('id-ID'), delta: 'Data terbaru', color: 'bg-white border border-neutral-100 text-neutral-800' },
        { icon: <BookOpen size={22} />, label: 'Artikel Edukasi', value: `${stats.total_artikel}+`, delta: 'Diperbarui setiap minggu', color: 'bg-white border border-neutral-100 text-neutral-800' },
      ]
    : [];

  const prevalensiStunting = stats && stats.balita_dipantau > 0
    ? ((stats.kasus_stunting / stats.balita_dipantau) * 100).toFixed(1)
    : null;
  const rasioArtikel = stats && stats.total_pasien > 0
    ? ((stats.total_artikel / stats.total_pasien) * 100000).toFixed(1)
    : null;

  return (
    <div className="space-y-8 font-body text-neutral-800">

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div className="relative bg-primary rounded-3xl overflow-hidden px-8 py-10">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute bottom-0 right-24 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute top-6 right-48 w-16 h-16 rounded-full bg-white/5" />

        <div className="relative z-10 max-w-2xl">
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest bg-white/20 text-white px-3 py-1 rounded-full mb-4">
            Sistem Informasi Gizi — Jawa Tengah
          </span>
          <h2 className="text-3xl font-bold text-white font-headline leading-tight mb-3">
            Wujudkan Generasi<br />
            <span className="text-emerald-300">Bebas Stunting</span> Bersama
          </h2>
          <p className="text-white/80 text-sm font-body leading-relaxed mb-6 max-w-lg">
            Platform monitoring gizi ibu dan anak berbasis komunitas. Pantau tumbuh kembang, akses edukasi kesehatan, dan kolaborasi lintas peran untuk Indonesia sehat.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <button className="flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold transition-colors">
              Pelajari Program <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Statistik publik ────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-neutral-800 font-headline">Statistik Kesehatan Jawa Tengah</h3>
          <span className="text-xs text-neutral-400 font-body">Diperbarui: Februari 2024</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {publicStats.map((s) => (
            <div key={s.label} className={`rounded-2xl p-5 relative overflow-hidden ${s.color}`}>
              <div className={`mb-3 ${s.color.includes('bg-white') ? 'text-primary' : 'text-white/80'}`}>
                {s.icon}
              </div>
              <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 font-body ${s.color.includes('bg-white') ? 'text-neutral-500' : 'text-white/70'}`}>
                {s.label}
              </p>
              <p className={`text-3xl font-bold font-headline leading-none mb-1 ${s.color.includes('bg-white') ? 'text-neutral-900' : 'text-white'}`}>
                {s.value}
              </p>
              <p className={`text-xs font-body ${s.color.includes('bg-white') ? 'text-neutral-500' : 'text-white/70'}`}>
                {s.delta}
              </p>
              {!s.color.includes('bg-white') && (
                <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Capaian program ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        {/* Capaian program wilayah */}
        <div className="bg-white rounded-2xl p-6 border border-neutral-100">
          <div className="flex items-center gap-2 mb-5">
            <Target size={20} className="text-primary" />
            <div>
              <h4 className="text-sm font-bold text-neutral-800 font-headline">Indikator Program</h4>
              <p className="text-xs text-neutral-500 font-body mt-0.5">Ringkasan capaian berdasarkan data terkini</p>
            </div>
          </div>
          {stats ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-neutral-700">Cakupan Pemantauan</span>
                  <span className="text-neutral-500">{stats.balita_dipantau.toLocaleString('id-ID')} balita</span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (stats.balita_dipantau / 2500000) * 100)}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-neutral-700">Prevalensi Stunting</span>
                  <span className="text-red-500 font-bold">{prevalensiStunting ?? 'N/A'}%</span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, parseFloat(prevalensiStunting ?? '0'))}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-neutral-700">Ketersediaan Edukasi</span>
                  <span className="text-neutral-500">{stats.total_artikel} artikel ({rasioArtikel}/100rb pasien)</span>
                </div>
                <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (stats.total_artikel / 50) * 100)}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-500 mt-3 pt-3 border-t border-neutral-100">
                <AlertTriangle size={12} />
                <span>Data diperbarui secara berkala. Login untuk melihat detail per wilayah.</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-400 text-center py-4">Memuat data...</p>
          )}
        </div>
      </div>

      {/* ── Artikel edukasi preview ─────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-800 font-headline">Edukasi Kesehatan Terbaru</h3>
            <p className="text-xs text-neutral-500 font-body mt-0.5">Informasi gizi untuk keluarga Indonesia</p>
          </div>
          <button
            onClick={() => navigate('/artikel')}
            className="text-xs text-primary font-semibold hover:text-primary-600 font-body flex items-center gap-1"
          >
            Lihat Semua <ChevronRight size={12} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {artikel.map((a) => (
            <div key={a.id_artikel} className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:shadow-md transition-shadow group cursor-pointer" onClick={() => navigate(`/artikel/${a.id_artikel}`)}>
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                <BookOpen size={48} className="text-primary/40" />
                <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wide bg-primary text-white px-2.5 py-1 rounded-full">
                  {a.kategori || 'Edukasi'}
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold text-neutral-800 font-headline leading-snug mb-1.5 line-clamp-2">
                  {a.judul}
                </h4>
                <p className="text-xs text-neutral-500 font-body line-clamp-2 mb-3">{a.ringkasan}</p>
                <div className="flex items-center gap-3 text-neutral-400 text-xs">
                  <span className="flex items-center gap-1"><User size={11} />{a.nama_penulis}</span>
                  {a.tanggal_publish && <span className="flex items-center gap-1"><Clock size={11} />{a.tanggal_publish}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
