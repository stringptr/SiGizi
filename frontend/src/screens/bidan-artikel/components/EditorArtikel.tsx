/**
 * EditorArtikel — form tulis/edit artikel — Orang 4 (Frontend 2)
 *
 * Mode create : CREATE_ARTIKEL (Bidan -> status "Menunggu Verifikasi",
 *               Dinkes -> langsung "Dipublikasikan", sesuai service.Create).
 * Mode edit   : isi lengkap diambil dulu lewat GET_ARTIKEL_DETAIL (daftar
 *               hanya punya `ringkasan` = LEFT(isi_artikel, 200)), lalu
 *               UPDATE_ARTIKEL.
 *
 * Setiap mutation dikirim `{ skipCache: true }` dan diikuti
 * `clearGraphQLCache()` — cache GET GraphQL ber-TTL 10 menit, tanpa
 * invalidasi daftar lama akan tetap tampil setelah submit.
 */
import { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useNotification } from '../../../context/NotificationContext';
import { gqlRequest, clearGraphQLCache, GraphQLError } from '../../../lib/graphql';
import {
  CREATE_ARTIKEL,
  UPDATE_ARTIKEL,
  GET_ARTIKEL_DETAIL,
} from '../../../graphql/artikel.queries';
import { pesanErrorGraphQL } from '../../../graphql/gqlError';
import type {
  CreateArtikelInputGQL,
  UpdateArtikelInputGQL,
  CreateArtikelPayloadGQL,
  ArtikelGQL,
} from '../../../types/graphql';
import { STATUS_ARTIKEL } from '../../../types/graphql';
import { KATEGORI_PILIHAN, isKategoriDikenal } from '../kategori';

interface EditorArtikelProps {
  /** null = mode tulis baru. */
  artikel: { idArtikel: number; judul: string; kategori: string; statusArtikel: string } | null;
  isDinkes: boolean;
  onClose: () => void;
  onSaved: (pesan: string) => void;
}

interface FormState {
  judul: string;
  kategori: string;
  isiArtikel: string;
}

export function EditorArtikel({ artikel, isDinkes, onClose, onSaved }: EditorArtikelProps): JSX.Element {
  const notify = useNotification();
  const modeEdit = artikel !== null;

  /**
   * `kategori` VARCHAR bebas — nilai di luar daftar seed bisa saja ada di
   * data lama, jadi ikut ditambahkan sebagai opsi supaya edit tidak diam-diam
   * mengganti kategori aslinya.
   */
  const opsiKategori: string[] =
    artikel?.kategori && !isKategoriDikenal(artikel.kategori)
      ? [...KATEGORI_PILIHAN, artikel.kategori]
      : [...KATEGORI_PILIHAN];

  const [form, setForm] = useState<FormState>({
    judul: artikel?.judul ?? '',
    kategori: artikel?.kategori || 'Gizi',
    isiArtikel: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [memuatIsi, setMemuatIsi] = useState(modeEdit);
  const [submitting, setSubmitting] = useState(false);

  // Edit: isi artikel tidak ada di daftar, ambil dari query detail.
  useEffect(() => {
    if (!modeEdit || !artikel) return;
    let ignore = false;

    (async () => {
      try {
        const data = await gqlRequest<{ artikel: ArtikelGQL | null }>(GET_ARTIKEL_DETAIL, {
          id: artikel.idArtikel,
        });
        if (ignore) return;
        if (!data.artikel) {
          notify.error('Artikel tidak ditemukan.');
          onClose();
          return;
        }
        setForm((f) => ({
          ...f,
          judul: data.artikel?.judul ?? f.judul,
          kategori: data.artikel?.kategori ?? f.kategori,
          isiArtikel: data.artikel?.isiArtikel ?? '',
        }));
      } catch (err) {
        if (ignore) return;
        notify.error(pesanErrorGraphQL(err, 'Gagal memuat isi artikel.'));
        onClose();
      } finally {
        if (!ignore) setMemuatIsi(false);
      }
    })();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artikel?.idArtikel]);

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.judul.trim()) e.judul = 'Judul wajib diisi';
    if (!form.isiArtikel.trim()) e.isiArtikel = 'Isi artikel wajib diisi';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      notify.warn('Mohon lengkapi semua data wajib.');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      if (modeEdit && artikel) {
        const input: UpdateArtikelInputGQL = {
          judul: form.judul.trim(),
          isiArtikel: form.isiArtikel,
          kategori: form.kategori,
        };
        await gqlRequest<{ updateArtikel: ArtikelGQL }>(
          UPDATE_ARTIKEL,
          { id: artikel.idArtikel, input },
          { skipCache: true },
        );
        clearGraphQLCache();
        onSaved('Artikel berhasil diperbarui.');
      } else {
        const input: CreateArtikelInputGQL = {
          judul: form.judul.trim(),
          isiArtikel: form.isiArtikel,
          kategori: form.kategori,
        };
        const data = await gqlRequest<{ createArtikel: CreateArtikelPayloadGQL }>(
          CREATE_ARTIKEL,
          { input },
          { skipCache: true },
        );
        clearGraphQLCache();
        onSaved(
          data.createArtikel.statusArtikel === STATUS_ARTIKEL.DIPUBLIKASIKAN
            ? 'Artikel berhasil dipublikasikan.'
            : 'Artikel dikirim dan menunggu verifikasi Dinas Kesehatan.',
        );
      }
    } catch (err) {
      const pesan =
        err instanceof GraphQLError && err.code === 'forbidden'
          ? pesanErrorGraphQL(err, 'Anda tidak memiliki izin untuk menyimpan artikel.')
          : pesanErrorGraphQL(err, 'Gagal menyimpan artikel. Silakan coba lagi.');
      notify.error(pesan);
      setSubmitting(false);
    }
  };

  const setField = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-neutral-800 font-headline">
              {modeEdit ? 'Edit Artikel' : 'Tulis Artikel Baru'}
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5 font-body">
              {isDinkes
                ? 'Artikel akan langsung dipublikasikan'
                : 'Artikel akan diverifikasi Dinas Kesehatan sebelum dipublikasikan'}
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

        {memuatIsi ? (
          <div className="p-10 flex flex-col items-center gap-3 text-neutral-400">
            <Loader2 size={24} className="animate-spin text-primary" />
            <p className="text-sm font-body">Memuat isi artikel...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-1.5 block font-body">
                Judul Artikel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.judul}
                onChange={(e) => setField({ judul: e.target.value })}
                placeholder="Masukkan judul artikel..."
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 ${
                  errors.judul ? 'border-red-300 bg-red-50' : 'border-neutral-200'
                }`}
              />
              {errors.judul && <p className="text-xs text-red-500 mt-1">{errors.judul}</p>}
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-1.5 block font-body">
                Kategori
              </label>
              <select
                value={form.kategori}
                onChange={(e) => setField({ kategori: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 bg-white"
              >
                {opsiKategori.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-neutral-700 mb-1.5 block font-body">
                Isi Artikel <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.isiArtikel}
                onChange={(e) => setField({ isiArtikel: e.target.value })}
                placeholder="Tulis isi artikel secara lengkap (paragraf dipisah baris kosong)..."
                rows={10}
                className={`w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-200 resize-none ${
                  errors.isiArtikel ? 'border-red-300 bg-red-50' : 'border-neutral-200'
                }`}
              />
              {errors.isiArtikel && (
                <p className="text-xs text-red-500 mt-1">{errors.isiArtikel}</p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 py-3 border border-neutral-200 text-neutral-600 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-primary hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                {modeEdit
                  ? 'Simpan Perubahan'
                  : isDinkes
                    ? 'Publikasikan Artikel'
                    : 'Kirim untuk Diverifikasi'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
