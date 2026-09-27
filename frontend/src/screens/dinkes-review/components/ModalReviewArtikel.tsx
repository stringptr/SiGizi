/**
 * ModalReviewArtikel — aksi Setujui/Tolak — Orang 4 (Frontend 2)
 *
 * Preview isi lengkap diambil dari `GET_ARTIKEL_DETAIL` (antrean pending
 * hanya memuat judul + penulis), lalu keputusan dikirim lewat mutasi
 * `reviewArtikel`:
 *   setujui -> status Dipublikasikan + id_verifikator + tanggal_publish
 *   tolak   -> status Ditolak + catatanReview (alasan wajib diisi di UI)
 *
 * Setelah mutation: clearGraphQLCache() + reload daftar oleh parent —
 * cache GET GraphQL ber-TTL 10 menit kalau tidak diinvalidasi.
 */
import { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, User, Calendar, Loader2, ArrowLeft } from 'lucide-react';
import { useNotification } from '../../../context/NotificationContext';
import { gqlRequest, clearGraphQLCache } from '../../../lib/graphql';
import { GET_ARTIKEL_DETAIL, REVIEW_ARTIKEL } from '../../../graphql/artikel.queries';
import { pesanErrorGraphQL } from '../../../graphql/gqlError';
import { StatusArtikelBadge } from '../../../components/StatusArtikelBadge';
import { formatTanggalPanjang, pecahParagraf } from '../../artikel/utils';
import type {
  ArtikelGQL,
  ArtikelPendingItemGQL,
  ReviewArtikelInputGQL,
  ReviewArtikelPayloadGQL,
} from '../../../types/graphql';

interface ModalReviewArtikelProps {
  artikel: ArtikelPendingItemGQL;
  onClose: () => void;
  /** Dipanggil dengan pesan sukses setelah mutation selesai. */
  onSelesai: (pesan: string) => void;
}

type Mode = 'preview' | 'tolak';

export function ModalReviewArtikel({ artikel, onClose, onSelesai }: ModalReviewArtikelProps): JSX.Element {
  const notify = useNotification();
  const [detail, setDetail] = useState<ArtikelGQL | null>(null);
  const [memuat, setMemuat] = useState(true);
  const [mode, setMode] = useState<Mode>('preview');
  const [catatan, setCatatan] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const data = await gqlRequest<{ artikel: ArtikelGQL | null }>(GET_ARTIKEL_DETAIL, {
          id: artikel.idArtikel,
        });
        if (ignore) return;
        setDetail(data.artikel);
      } catch (err) {
        if (ignore) return;
        notify.error(pesanErrorGraphQL(err, 'Gagal memuat isi artikel.'));
        onClose();
      } finally {
        if (!ignore) setMemuat(false);
      }
    })();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artikel.idArtikel]);

  const kirim = async (aksi: 'setujui' | 'tolak') => {
    if (submitting) return;
    if (aksi === 'tolak' && !catatan.trim()) {
      notify.warn('Alasan penolakan wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const input: ReviewArtikelInputGQL = {
        aksi,
        catatanReview: aksi === 'tolak' ? catatan.trim() : null,
      };
      await gqlRequest<{ reviewArtikel: ReviewArtikelPayloadGQL }>(
        REVIEW_ARTIKEL,
        { id: artikel.idArtikel, input },
        { skipCache: true },
      );
      clearGraphQLCache();
      onSelesai(
        aksi === 'setujui'
          ? `Artikel "${artikel.judul}" disetujui dan dipublikasikan.`
          : `Artikel "${artikel.judul}" ditolak.`,
      );
    } catch (err) {
      notify.error(pesanErrorGraphQL(err, 'Gagal memproses review artikel.'));
      setSubmitting(false);
    }
  };

  const paragraf = pecahParagraf(detail?.isiArtikel);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-neutral-800 font-headline">Review Artikel</h2>
            <p className="text-xs text-neutral-500 mt-0.5 font-body">
              {mode === 'tolak'
                ? 'Berikan alasan penolakan untuk penulis'
                : 'Tinjau artikel dari Bidan sebelum memutuskan'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        {memuat ? (
          <div className="p-10 flex flex-col items-center gap-3 text-neutral-400">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-sm font-body">Memuat isi artikel...</p>
          </div>
        ) : mode === 'tolak' ? (
          /* ── Form penolakan ─────────────────────────────────────────── */
          <div className="p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-red-700 font-body">
                Tolak "{artikel.judul}"
              </p>
              <p className="text-xs text-red-600 mt-0.5 font-body">
                Alasan akan disimpan sebagai catatan review dan dikirim ke penulis.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-1.5 block font-body">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Mohon lengkapi sumber referensi pada paragraf kedua..."
                rows={5}
                autoFocus
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setMode('preview')}
                disabled={submitting}
                className="flex-1 py-3 border border-neutral-200 text-neutral-600 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ArrowLeft size={15} />
                Kembali
              </button>
              <button
                type="button"
                onClick={() => kirim('tolak')}
                disabled={submitting || !catatan.trim()}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                <XCircle size={16} />
                Kirim Penolakan
              </button>
            </div>
          </div>
        ) : (
          /* ── Preview + keputusan ────────────────────────────────────── */
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <StatusArtikelBadge status={artikel.statusArtikel} />
            </div>

            <div>
              <h3 className="text-base font-bold text-neutral-800 font-headline">
                {artikel.judul}
              </h3>
              <div className="flex items-center gap-4 text-xs text-neutral-500 font-body mt-2 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-primary" />
                  {artikel.penulis.nama}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-primary" />
                  Dikirim {formatTanggalPanjang(artikel.createdAt)}
                </span>
                {detail?.kategori && <span>{detail.kategori}</span>}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                Isi Artikel
              </p>
              <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-4 max-h-64 overflow-y-auto space-y-3">
                {!detail || paragraf.length === 0 ? (
                  <p className="text-sm text-neutral-400 italic">Artikel belum memiliki isi.</p>
                ) : (
                  paragraf.map((p, i) => (
                    <p key={i} className="text-sm text-neutral-700 font-body leading-relaxed">
                      {p}
                    </p>
                  ))
                )}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800 mb-1 font-body">
                Keputusan Verifikasi
              </p>
              <p className="text-xs text-amber-700 font-body leading-relaxed mb-4">
                Jika disetujui, artikel akan langsung dipublikasikan dan tercatat sebagai
                verifier Anda. Jika ditolak, penulis menerima catatan untuk perbaikan.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setMode('tolak')}
                  disabled={submitting}
                  className="flex-1 py-3 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <XCircle size={16} />
                  Tolak Artikel
                </button>
                <button
                  type="button"
                  onClick={() => kirim('setujui')}
                  disabled={submitting}
                  className="flex-1 py-3 bg-primary hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 size={15} className="animate-spin" />}
                  <CheckCircle size={16} />
                  Setujui & Publikasikan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
