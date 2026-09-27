/**
 * useArtikelSaya — daftar artikel milik Bidan yang sedang login.
 *
 * Schema GraphQL tidak punya filter penulis (lihat
 * backend/internal/graphql/graph/schema.graphqls), jadi:
 *   1. query `daftarArtikelSemua` (role ADMIN — Bidan memilikinya)
 *   2. filter client-side `idPenulis === user.idUser`
 *
 * `perPage` maksimal 100 (backend/internal/pagination.ValidatePerPage),
 * sama dengan katalog Orang 3 — di atas 100 artikel total, daftar akan
 * terpotong sampai backend menambah argumen filter.
 *
 * Pola fetch-nya meniru `useArtikelKatalog` (Orang 3): satu effect dengan
 * flag `ignore`, reload lewat `reloadKey` yang hanya boleh diubah dari
 * event handler — aman dari `react-hooks/set-state-in-effect`.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { gqlRequest } from '../../../lib/graphql';
import { GET_ARTIKEL_SEMUA } from '../../../graphql/artikel.queries';
import { pesanErrorGraphQL } from '../../../graphql/gqlError';
import type { ArtikelListItemGQL, ArtikelListPayloadGQL } from '../../../types/graphql';

const PER_PAGE_MAX = 100;
const PAGE_SIZE = 8;

export type FilterStatus = 'Semua' | 'Menunggu Verifikasi' | 'Ditolak' | 'Dipublikasikan' | 'Draft';

export const FILTER_STATUS: FilterStatus[] = [
  'Semua',
  'Menunggu Verifikasi',
  'Ditolak',
  'Dipublikasikan',
  'Draft',
];

interface UseArtikelSayaArgs {
  idUser: number;
  /**
   * false = jangan fetch sama sekali (belum login / role bukan Bidan).
   * Menghindari request `daftarArtikelSemua` yang pasti 401/403 — guard
   * role di halaman tetap penjaga tampilan, hook ini penjaga jaringan.
   */
  aktif: boolean;
}

export function useArtikelSaya({ idUser, aktif }: UseArtikelSayaArgs) {
  const [semua, setSemua] = useState<ArtikelListItemGQL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusAktif, setStatusAktif] = useState<FilterStatus>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    // Tidak aktif: biarkan loading=true (guard halaman menampilkan panel
    // akses, jadi skeleton tidak pernah terlihat) tanpa menyentuh state.
    if (!aktif) return;
    let ignore = false;

    (async () => {
      try {
        const data = await gqlRequest<{ daftarArtikelSemua: ArtikelListPayloadGQL }>(
          GET_ARTIKEL_SEMUA,
          { page: 1, perPage: PER_PAGE_MAX },
        );
        if (ignore) return;
        setSemua(data.daftarArtikelSemua.items);
        setError(null);
      } catch (err) {
        if (ignore) return;
        setSemua([]);
        setError(pesanErrorGraphQL(err, 'Gagal memuat artikel Anda.'));
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [aktif, idUser, reloadKey]);

  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  /** Dipanggil setelah mutation supaya daftar ikut segar. */
  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  /** Hanya artikel milik user yang login. */
  const artikelSaya = useMemo(
    () => semua.filter((a) => a.idPenulis === idUser),
    [semua, idUser],
  );

  const jumlahPerStatus = useMemo(() => {
    const hitung: Record<FilterStatus, number> = {
      Semua: artikelSaya.length,
      'Menunggu Verifikasi': 0,
      Ditolak: 0,
      Dipublikasikan: 0,
      Draft: 0,
    };
    for (const a of artikelSaya) {
      if (a.statusArtikel in hitung && a.statusArtikel !== 'Semua') {
        hitung[a.statusArtikel as Exclude<FilterStatus, 'Semua'>] += 1;
      }
    }
    return hitung;
  }, [artikelSaya]);

  const hasilFilter = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return artikelSaya.filter((a) => {
      const matchStatus = statusAktif === 'Semua' || a.statusArtikel === statusAktif;
      if (!matchStatus) return false;
      if (!q) return true;
      return (
        a.judul.toLowerCase().includes(q) ||
        a.kategori.toLowerCase().includes(q) ||
        a.penulis.nama.toLowerCase().includes(q)
      );
    });
  }, [artikelSaya, statusAktif, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(hasilFilter.length / PAGE_SIZE));
  const pageAktif = Math.min(Math.max(1, page), totalPages);

  const gantiStatus = useCallback((s: FilterStatus) => {
    setStatusAktif(s);
    setPage(1);
  }, []);
  const gantiSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setPage(1);
  }, []);
  const gantiPage = useCallback(
    (p: number) => setPage(Math.max(1, Math.min(p, totalPages))),
    [totalPages],
  );

  const start = (pageAktif - 1) * PAGE_SIZE;
  const items = useMemo(
    () => hasilFilter.slice(start, start + PAGE_SIZE),
    [hasilFilter, start],
  );

  return {
    items,
    totalTerfilter: hasilFilter.length,
    jumlahPerStatus,
    loading,
    error,
    retry,
    reload,
    statusAktif,
    gantiStatus,
    searchQuery,
    gantiSearch,
    page: pageAktif,
    gantiPage,
    totalPages,
    pageSize: PAGE_SIZE,
  };
}
