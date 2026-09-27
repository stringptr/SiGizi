/**
 * Hook detail artikel — Orang 3 (Frontend 1)
 *
 * Membaca lewat query GraphQL `artikel(id)` (public, tanpa login).
 *
 * Query `artikel` nullable di skema (`artikel(id: Int!): Artikel`), jadi
 * artikel tidak ada bisa muncul lewat DUA jalur berbeda:
 *   1. `data.artikel === null` — resolver mengembalikan null
 *   2. errors[] dengan extensions.code = "not_found" — resolver mengembalikan
 *      *errorutils.Error 404
 * Keduanya dinormalisasi jadi GraphQLError code 'not_found' supaya UI tidak
 * perlu membedakan.
 */
import { useCallback, useEffect, useState } from 'react';
import { gqlRequest, GraphQLError } from '../../../lib/graphql';
import { GET_ARTIKEL_DETAIL } from '../../../graphql/artikel.queries';
import type { ArtikelGQL } from '../../../types/graphql';

interface DetailState {
  artikel: ArtikelGQL | null;
  error: GraphQLError | null;
  loading: boolean;
}

const KOSONG: DetailState = { artikel: null, error: null, loading: true };

export function useArtikelDetail(idArtikel: string | undefined) {
  const [state, setState] = useState<DetailState>(KOSONG);
  // "Muat ulang" menaikkan reloadKey; effect di bawah yang melakukan fetch.
  const [reloadKey, setReloadKey] = useState(0);

  // Sengaja dihitung saat render, bukan lewat state: ID tidak valid tidak
  // perlu di-request sama sekali, dan ini menghindari setState sinkron di
  // dalam effect.
  const id = Number(idArtikel);
  const idValid = Boolean(idArtikel) && Number.isInteger(id) && id > 0;

  useEffect(() => {
    if (!idValid) return;

    let ignore = false;

    (async () => {
      try {
        const data = await gqlRequest<{ artikel: ArtikelGQL | null }>(GET_ARTIKEL_DETAIL, { id });
        if (ignore) return;
        if (!data.artikel) {
          setState({
            artikel: null,
            error: new GraphQLError('Artikel tidak ditemukan.', 'not_found', 404),
            loading: false,
          });
          return;
        }
        setState({ artikel: data.artikel, error: null, loading: false });
      } catch (err) {
        if (ignore) return;
        setState({
          artikel: null,
          error:
            err instanceof GraphQLError
              ? err
              : new GraphQLError('Gagal memuat artikel.', 'internal', 500),
          loading: false,
        });
      }
    })();

    return () => {
      ignore = true;
    };
  }, [id, idValid, reloadKey]);

  /** Dipakai tombol "Coba Lagi" / "Muat ulang" — event handler, setState aman. */
  const retry = useCallback(() => {
    if (!idValid) return;
    setState((s) => ({ ...s, loading: true }));
    setReloadKey((k) => k + 1);
  }, [idValid]);

  // ID tidak valid diperlakukan sebagai "tidak ditemukan" tanpa request.
  const error =
    state.error ?? (idValid ? null : new GraphQLError('ID artikel tidak valid.', 'not_found', 404));

  return {
    artikel: state.artikel,
    loading: idValid && state.loading,
    error,
    retry,
    /** true kalau errornya "tidak ada", false kalau gagal jaringan/server. */
    notFound: error?.code === 'not_found',
  };
}
