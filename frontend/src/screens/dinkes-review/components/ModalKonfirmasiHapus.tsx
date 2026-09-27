/**
 * ModalKonfirmasiHapus — hapus artikel dari dashboard Dinkes — Orang 4
 *
 * Tersambung ke mutasi `deleteArtikel` (role DINKES saja di backend).
 * Setelah sukses: clearGraphQLCache() + reload antrean oleh parent.
 */
import { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useNotification } from '../../../context/NotificationContext';
import { gqlRequest, clearGraphQLCache } from '../../../lib/graphql';
import { DELETE_ARTIKEL } from '../../../graphql/artikel.queries';
import { pesanErrorGraphQL } from '../../../graphql/gqlError';

interface ModalKonfirmasiHapusProps {
  idArtikel: number;
  judul: string;
  onClose: () => void;
  onSelesai: (pesan: string) => void;
}

export function ModalKonfirmasiHapus({
  idArtikel,
  judul,
  onClose,
  onSelesai,
}: ModalKonfirmasiHapusProps): JSX.Element {
  const notify = useNotification();
  const [submitting, setSubmitting] = useState(false);

  const hapus = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await gqlRequest<{ deleteArtikel: boolean }>(
        DELETE_ARTIKEL,
        { id: idArtikel },
        { skipCache: true },
      );
      clearGraphQLCache();
      onSelesai(`Artikel "${judul}" berhasil dihapus.`);
    } catch (err) {
      notify.error(pesanErrorGraphQL(err, 'Gagal menghapus artikel.'));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-lg font-bold text-neutral-800 font-headline">Hapus Artikel</h2>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={24} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-800 mb-1 font-body">
                Apakah Anda yakin ingin menghapus artikel ini?
              </p>
              <p className="text-sm text-neutral-600 font-body leading-relaxed">
                Artikel{' '}
                <span className="font-semibold text-neutral-800">"{judul}"</span> akan
                dihapus secara permanen dan tidak dapat dipulihkan.
              </p>
            </div>
          </div>

          <div className="bg-neutral-50 rounded-xl p-3 mb-6 border border-neutral-100">
            <p className="text-sm text-neutral-700 font-body leading-relaxed line-clamp-2">
              {judul}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-3 border border-neutral-200 text-neutral-600 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={hapus}
              disabled={submitting}
              className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={15} className="animate-spin" />}
              <Trash2 size={15} />
              Ya, Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
