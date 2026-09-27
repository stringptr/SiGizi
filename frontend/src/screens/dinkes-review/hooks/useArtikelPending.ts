/**
 * useArtikelPending — antrean verifikasi Dinkes — Orang 4 (Frontend 2)
 *
 * Query `daftarArtikelPending` sudah difilter server (status "Menunggu
 * Verifikasi", role DINKES) dan memakai paginasi server-side, jadi
 * `meta.lastPage` / `meta.total` dipakai apa adanya — berbeda dengan
 * daftar Bidan yang di-filter di client.
 *
 * Pola fetch sama dengan hook Orang 3: reload lewat `reloadKey` dari
 * event handler (aman dari react-hooks/set-state-in-effect).
 */
import { useCallback, useEffect, useState } from 'react';
import { gqlRequest } from '../../../lib/graphql';
import { GET_ARTIKEL_PENDING } from '../../../graphql/artikel.queries';
import { pesanErrorGraphQL } from '../../../graphql/gqlError';
import type { ArtikelPendingItemGQL, ArtikelPendingPayloadGQL } from '../../../types/graphql';

const PER_PAGE = 10;

export function useArtikelPending(aktif: boolean) {
  const [items, setItems] = useState<ArtikelPendingItemGQL[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Tidak aktif (belum login / role bukan Dinkes): jangan fetch — pasti
    // 401/403. Guard role di halaman menampilkan panel akses, jadi
    // loading yang tidak pernah turun tidak terlihat user.
    if (!aktif) return;
    let ignore = false;

    (async () => {
      try {
        const data = await gqlRequest<{ daftarArtikelPending: ArtikelPendingPayloadGQL }>(
          GET_ARTIKEL_PENDING,
          { page, perPage: PER_PAGE },
        );
        if (ignore) return;
        setItems(data.daftarArtikelPending.items);
        setTotal(data.daftarArtikelPending.meta.total);
        setLastPage(Math.max(1, data.daftarArtikelPending.meta.lastPage));
        setError(null);
      } catch (err) {
        if (ignore) return;
        setItems([]);
        setTotal(0);
        setLastPage(1);
        setError(pesanErrorGraphQL(err, 'Gagal memuat antrean verifikasi.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [aktif, page, reloadKey]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  /** Setelah review/hapus: refresh halaman berjalan (bisa jadi kosong). */
  const reload = useCallback(() => {
    setLoading(true);
    setReloadKey((k) => k + 1);
  }, []);

  const gantiPage = useCallback(
    (p: number) => setPage(Math.max(1, Math.min(p, lastPage))),
    [lastPage],
  );

  return {
    items,
    total,
    lastPage,
    page,
    gantiPage,
    loading,
    error,
    retry,
    reload,
    pageSize: PER_PAGE,
  };
}
