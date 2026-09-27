/**
 * Penerjemah error GraphQL ke pesan toast — Orang 4 (Frontend 2)
 *
 * `gqlRequest` melempar `GraphQLError` yang sudah membawa `code` dari
 * `errors[0].extensions.code` (lihat lib/graphql.ts):
 *   422 -> invalid | 401 -> unauthorized | 403 -> forbidden
 *   404 -> not_found | lainnya -> internal
 *
 * Pesan dari backend sudah berbahasa Indonesia, jadi dipakai apa adanya
 * sebagai preferensi utama; `fallback` hanya untuk kasus jaringan/tidak
 * dikenal.
 */
import { GraphQLError } from '../lib/graphql';

const PESAN_UMUM: Record<string, string> = {
  unauthorized: 'Sesi Anda telah berakhir. Silakan login kembali.',
  forbidden: 'Anda tidak memiliki izin untuk melakukan aksi ini.',
  invalid: 'Data tidak valid. Mohon periksa kembali isian Anda.',
  not_found: 'Artikel tidak ditemukan.',
};

export function pesanErrorGraphQL(err: unknown, fallback: string): string {
  if (err instanceof GraphQLError) {
    if (err.message && err.code !== 'internal') return err.message;
    return PESAN_UMUM[err.code] ?? err.message ?? fallback;
  }
  return fallback;
}
