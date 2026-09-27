/**
 * Hook katalog artikel — Orang 3 (Frontend 1)
 *
 * Membaca lewat query GraphQL `daftarArtikel` (public, tanpa login).
 *
 * CATATAN PENTING soal filter & paginasi:
 * `daftarArtikel(page, perPage)` tidak menerima argumen kategori maupun
 * pencarian di backend, jadi FETCHING satu halaman besar lalu filtering &
 * slicing di client. `perPage` dibatasi 100 oleh
 * `backend/internal/pagination.ValidatePerPage`. Kalau jumlah artikel
 * published lewat dari 100, filter client-side tidak lagi mencakup seluruh
 * data — saat itu query perlu argumen filter di backend (lihat
 * docs-graphql/frontend-client.md).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { gqlRequest, GraphQLError } from '../../../lib/graphql';
import { GET_ARTIKEL_LIST } from '../../../graphql/artikel.queries';
import type { ArtikelListItemGQL, ArtikelListPayloadGQL } from '../../../types/graphql';
import {
  KATEGORI_LAINNYA,
  SEMUA_KATEGORI,
  turunkanKategoriList,
} from '../utils';

/** Batas atas `perPage` di backend/internal/pagination.ValidatePerPage. */
const PER_PAGE_MAX = 100;
const PAGE_SIZE = 9;
/** Hero memakai 3 item; butuh minimal 3 agar tidak ada kolom kosong. */
const HERO_COUNT = 3;

export function useArtikelKatalog() {
  const [items, setItems] = useState<ArtikelListItemGQL[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<GraphQLError | null>(null);

  const [kategoriAktif, setKategoriAktif] = useState<string>(SEMUA_KATEGORI);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);

  /**
   * "Coba Lagi" menaikkan reloadKey; effect di bawah yang benar-benar
   * melakukan fetch. Ini menghindari pemanggilan fungsi async yang menulis
   * state langsung dari body effect (cascading render).
   */
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    (async () => {
      try {
        const data = await gqlRequest<{ daftarArtikel: ArtikelListPayloadGQL }>(GET_ARTIKEL_LIST, {
          page: 1,
          perPage: PER_PAGE_MAX,
        });
        if (ignore) return;
        setItems(data.daftarArtikel.items);
        setTotal(data.daftarArtikel.meta.total);
        setError(null);
      } catch (err) {
        if (ignore) return;
        setItems([]);
        setTotal(0);
        setError(
          err instanceof GraphQLError
            ? err
            : new GraphQLError('Gagal memuat artikel.', 'internal', 500),
        );
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    return () => {
      ignore = true;
    };
  }, [reloadKey]);

  /** Dipakai tombol "Coba Lagi" — event handler, jadi setState aman. */
  const retry = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  // Kategori turunan dari data yang benar-benar dimuat, bukan konstanta.
  const kategoriList = useMemo(() => turunkanKategoriList(items), [items]);

  const hasilFilter = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((a) => {
      const kategori = a.kategori?.trim();
      const matchKategori =
        kategoriAktif === SEMUA_KATEGORI ||
        (kategoriAktif === KATEGORI_LAINNYA ? !kategori : kategori === kategoriAktif);
      if (!matchKategori) return false;
      if (!q) return true;
      return (
        a.judul.toLowerCase().includes(q) ||
        a.ringkasan.toLowerCase().includes(q) ||
        a.penulis.nama.toLowerCase().includes(q)
      );
    });
  }, [items, kategoriAktif, searchQuery]);

  // 3 artikel teratas dipin sebagai "featured" di halaman 1, lalu grid
  // mempaginasikan SISANYA. Offset-nya konsisten di semua halaman supaya 3
  // artikel yang sama tidak terulang dan nomor "Menampilkan x-y" di
  // Paginator tetap mengacu ke posisi asli pada daftar.
  const pinned = !loading && !error && hasilFilter.length >= HERO_COUNT;
  const rangeOffset = pinned ? HERO_COUNT : 0;
  const list = pinned ? hasilFilter.slice(HERO_COUNT) : hasilFilter;
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));

  // Page di-clamp saat RENDER, bukan lewat effect, supaya tidak ada
  // cascading render. Efek samping "kembali ke halaman 1" saat filter
  // berubah dilakukan langsung di event handler-nya.
  const pageAktif = Math.min(Math.max(1, page), totalPages);

  const gantiPage = useCallback((p: number) => setPage(Math.max(1, Math.min(p, totalPages))), [totalPages]);
  const gantiKategori = useCallback((k: string) => {
    setKategoriAktif(k);
    setPage(1);
  }, []);
  const gantiSearch = useCallback((q: string) => {
    setSearchQuery(q);
    setPage(1);
  }, []);

  // Hero hanya di halaman 1 — kalau muncul di semua halaman, 3 artikel yang
  // sama akan terulang tiap ganti halaman.
  const heroItems = pinned && pageAktif === 1 ? hasilFilter.slice(0, HERO_COUNT) : [];

  const start = (pageAktif - 1) * PAGE_SIZE;
  const gridItems = useMemo(() => list.slice(start, start + PAGE_SIZE), [list, start]);

  return {
    total,
    loading,
    error,
    retry,
    kategoriList,
    kategoriAktif,
    gantiKategori,
    searchQuery,
    gantiSearch,
    page: pageAktif,
    gantiPage,
    totalPages,
    pageSize: PAGE_SIZE,
    /** Jumlah item di luar daftar grid (kartu hero), untuk Paginator. */
    rangeOffset,
    totalTerfilter: hasilFilter.length,
    adaFilterAktif: kategoriAktif !== SEMUA_KATEGORI || searchQuery.trim() !== '',
    heroItems,
    gridItems,
  };
}
