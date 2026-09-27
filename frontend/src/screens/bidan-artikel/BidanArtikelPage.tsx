/**
 * BidanArtikelPage — route `/bidan/artikel` — Orang 4 (Frontend 2)
 *
 * Manajemen artikel milik Bidan: daftar + status (Draft, Menunggu
 * Verifikasi, Ditolak, Dipublikasikan) + form tulis/edit yang tersambung
 * ke mutasi GraphQL `createArtikel` / `updateArtikel`.
 *
 * Pengganti `screens/edukasi` (BidanSection + ModalTambah/ModalEdit) yang
 * semula memakai REST `POST /artikel` & `PATCH /artikel/{id}`.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Eye, Search, BookOpen, ShieldAlert, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { useArtikelSaya, FILTER_STATUS } from './hooks/useArtikelSaya';
import { EditorArtikel } from './components/EditorArtikel';
import { StatusArtikelBadge } from '../../components/StatusArtikelBadge';
import { EmptyState } from '../artikel/components/EmptyState';
import { Paginator } from '../../components/Paginator';
import { formatTanggalPendek } from '../artikel/utils';
import { STATUS_ARTIKEL } from '../../types/graphql';

/**
 * Backend (service.Update) hanya mengizinkan non-Dinkes mengedit artikel
 * berstatus "Menunggu Verifikasi" — status lain dibalas 403, jadi tombol
 * edit hanya aktif di status itu supaya user tidak memicu error.
 */
const STATUS_BISA_EDIT = STATUS_ARTIKEL.MENUNGGU_VERIFIKASI;

type Target = { idArtikel: number; judul: string; kategori: string; statusArtikel: string };

export default function BidanArtikelPage(): JSX.Element {
  const { isLoggedIn, user } = useAuth();
  const notify = useNotification();
  const [editor, setEditor] = useState<{ buka: boolean; target: Target | null }>({
    buka: false,
    target: null,
  });

  const roleBidan = user?.role === 'Bidan';
  const hook = useArtikelSaya({
    idUser: user?.idUser ?? -1,
    aktif: Boolean(isLoggedIn && roleBidan),
  });

  // ── Guard role (backend tetap penjaga final: 401/403 dari resolver) ──
  if (!isLoggedIn || !user) {
    return (
      <div className="max-w-lg mx-auto mt-10 text-center font-body bg-white rounded-2xl border border-neutral-100 p-10">
        <ShieldAlert size={40} className="mx-auto text-amber-400" />
        <h2 className="text-lg font-bold text-neutral-800 font-headline mt-3">Silakan login</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Halaman manajemen artikel membutuhkan akun Bidan.
        </p>
        <Link
          to="/login"
          className="mt-5 inline-flex items-center gap-2 bg-primary hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <LogIn size={15} />
          Ke Halaman Login
        </Link>
      </div>
    );
  }

  if (!roleBidan) {
    return (
      <div className="max-w-lg mx-auto mt-10 text-center font-body bg-white rounded-2xl border border-neutral-100 p-10">
        <ShieldAlert size={40} className="mx-auto text-red-300" />
        <h2 className="text-lg font-bold text-neutral-800 font-headline mt-2">Akses ditolak</h2>
        <p className="text-sm text-neutral-500 mt-1">
          Halaman ini hanya tersedia untuk role Bidan.
        </p>
        <Link
          to="/artikel"
          className="mt-5 inline-block text-sm text-primary font-semibold hover:text-primary-600"
        >
          ← Kembali ke Katalog Artikel
        </Link>
      </div>
    );
  }

  const bukaTulis = () => setEditor({ buka: true, target: null });
  const bukaEdit = (t: Target) => setEditor({ buka: true, target: t });

  const setelahTersimpan = (pesan: string) => {
    setEditor({ buka: false, target: null });
    notify.success(pesan);
    hook.reload();
  };

  return (
    <div className="max-w-5xl font-body text-neutral-800 space-y-6">
      {/* Heading + aksi utama */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-1">
            Manajemen Artikel Bidan
          </p>
          <h2 className="text-2xl font-bold text-neutral-900 font-headline leading-tight">
            Artikel Saya
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Tulis dan pantau status artikel sebelum diverifikasi Dinas Kesehatan.
          </p>
        </div>
        <button
          onClick={bukaTulis}
          className="flex items-center gap-2 bg-primary hover:bg-primary-600 text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus size={17} />
          Tulis Artikel
        </button>
      </div>

      {/* Banner alur verifikasi */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
        <span className="text-amber-500 leading-none mt-0.5">⏳</span>
        <p className="text-xs text-amber-700 font-medium leading-relaxed">
          Artikel yang Anda buat akan dikirim ke Dinas Kesehatan untuk diverifikasi
          sebelum dipublikasikan. Artikel berstatus{' '}
          <strong>Menunggu Verifikasi</strong> masih bisa diedit; setelah direview,
          statusnya berubah menjadi Dipublikasikan atau Ditolak.
        </p>
      </div>

      {/* Filter status */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTER_STATUS.map((s) => {
          const aktif = hook.statusAktif === s;
          const jumlah = hook.jumlahPerStatus[s];
          return (
            <button
              key={s}
              onClick={() => hook.gantiStatus(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                aktif
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-primary/40'
              }`}
            >
              {s}
              <span className={aktif ? 'text-white/80' : 'text-neutral-400'}> ({jumlah})</span>
            </button>
          );
        })}
        <div className="relative ml-auto">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={hook.searchQuery}
            onChange={(e) => hook.gantiSearch(e.target.value)}
            placeholder="Cari judul artikel..."
            className="pl-8 pr-3 py-2 text-xs border border-neutral-200 rounded-xl w-56 focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white"
          />
        </div>
      </div>

      {/* Daftar */}
      {hook.loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-neutral-100 rounded-xl p-4 flex items-center gap-4 animate-pulse"
            >
              <div className="flex-1 space-y-2">
                <div className="h-4 w-2/3 bg-neutral-200/70 rounded" />
                <div className="h-3 w-1/3 bg-neutral-200/70 rounded" />
              </div>
              <div className="h-6 w-24 bg-neutral-200/70 rounded-full" />
            </div>
          ))}
        </div>
      ) : hook.error ? (
        <EmptyState kind="error" onRetry={hook.retry} />
      ) : hook.items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-neutral-100">
          <BookOpen size={44} className="mx-auto text-neutral-300" />
          <p className="font-semibold text-neutral-600 mt-3">
            {hook.totalTerfilter === 0 && hook.jumlahPerStatus.Semua === 0
              ? 'Belum ada artikel milik Anda'
              : 'Tidak ada artikel yang cocok'}
          </p>
          <p className="text-sm text-neutral-400 mt-1">
            {hook.totalTerfilter === 0 && hook.jumlahPerStatus.Semua === 0
              ? 'Mulai tulis artikel kesehatan pertama Anda.'
              : 'Coba ubah filter status atau kata kunci pencarian.'}
          </p>
          {hook.jumlahPerStatus.Semua === 0 && (
            <button
              onClick={bukaTulis}
              className="mt-5 inline-flex items-center gap-2 bg-primary hover:bg-primary-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Plus size={15} />
              Tulis Artikel Pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {hook.items.map((a) => {
            const bisaEdit = a.statusArtikel === STATUS_BISA_EDIT;
            return (
              <div
                key={a.idArtikel}
                className="bg-white border border-neutral-100 rounded-xl p-4 sm:p-5 flex items-start sm:items-center gap-4 flex-wrap hover:border-primary/30 transition-colors"
              >
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-semibold text-neutral-800 text-sm sm:text-base font-headline">
                      {a.judul}
                    </h3>
                    <StatusArtikelBadge status={a.statusArtikel} />
                  </div>
                  <p className="text-xs text-neutral-400 mt-1.5">
                    {a.kategori || 'Tanpa kategori'} ·{' '}
                    {a.tanggalPublish
                      ? `Terbit ${formatTanggalPendek(a.tanggalPublish)}`
                      : 'Belum dipublikasikan'}
                  </p>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <Link
                    to={`/artikel/${a.idArtikel}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    <Eye size={14} />
                    Lihat
                  </Link>
                  <button
                    onClick={() =>
                      bukaEdit({
                        idArtikel: a.idArtikel,
                        judul: a.judul,
                        kategori: a.kategori,
                        statusArtikel: a.statusArtikel,
                      })
                    }
                    disabled={!bisaEdit}
                    title={
                      bisaEdit
                        ? 'Edit artikel'
                        : 'Hanya artikel berstatus Menunggu Verifikasi yang bisa diedit'
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Paginator
        page={hook.page}
        totalPages={hook.totalPages}
        totalItems={hook.totalTerfilter}
        pageSize={hook.pageSize}
        onPageChange={hook.gantiPage}
      />

      {editor.buka && (
        <EditorArtikel
          artikel={editor.target}
          isDinkes={false}
          onClose={() => setEditor({ buka: false, target: null })}
          onSaved={setelahTersimpan}
        />
      )}
    </div>
  );
}
