/**
 * GraphQL client — Orang 3 (Frontend 1)
 *
 * Custom fetch wrapper, tanpa dependency baru. Sengaja tidak memakai Apollo
 * supaya tidak bentrok dengan arsitektur zustand + cache lokal di `lib/api.ts`.
 *
 * Auth: browser otomatis mengirim cookie httpOnly `access_token` ke /graphql
 * karena memakai `credentials: 'include'`. Backend membacanya di
 * `internal/graphql/middleware.go` (AuthMiddleware) lalu menaruh
 * *jwtutils.Claim ke context di kunci `httputils.AccessKey`.
 *
 * Error: backend memetakan *errorutils.Error ke extensions GraphQL lewat
 * ErrorPresenter (backend/internal/graphql/middleware.go) dengan
 *   422 -> invalid | 401 -> unauthorized | 403 -> forbidden
 *   404 -> not_found  | 500/lainnya -> internal
 * Klasifikasi ini diterjemahkan ke GraphQLError di bawah supaya UI bisa
 * menampilkan pesan yang tepat tanpa menebak dari HTTP status (GraphQL
 * selalu membalas 200 kalau transport-nya sukses).
 */
import { apiPost } from './api';

const GRAPHQL_URL = import.meta.env.VITE_GRAPHQL_URL || '/graphql';

const REQUEST_TIMEOUT = 30000;
const CACHE_TTL = 600000; // 10 menit — sama dengan cache GET di lib/api.ts

export interface GraphQLErrorItem {
  message: string;
  id?: string;
  location?: string;
}

export type GraphQLErrorCode =
  | 'invalid'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'internal';

export class GraphQLError extends Error {
  readonly code: GraphQLErrorCode;
  readonly status: number;
  readonly errors: GraphQLErrorItem[];

  constructor(message: string, code: GraphQLErrorCode, status: number, errors: GraphQLErrorItem[] = []) {
    super(message);
    this.name = 'GraphQLError';
    this.code = code;
    this.status = status;
    this.errors = errors;
  }
}

interface GraphQLErrorEntry {
  message: string;
  extensions?: {
    code?: string;
    status?: number;
    errors?: GraphQLErrorItem[];
  };
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLErrorEntry[];
}

function toGraphQLError(err: GraphQLErrorEntry): GraphQLError {
  const ext = err.extensions ?? {};
  const code = (ext.code as GraphQLErrorCode) ?? 'internal';
  const status = ext.status ?? 500;
  return new GraphQLError(err.message || 'Terjadi kesalahan.', code, status, ext.errors ?? []);
}

const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data as T;
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * Mengosongkan cache GraphQL. Dipanggil dari `clearCache()` di lib/api.ts
 * (mutasi REST) dan dari halaman Orang 4 setelah mutation artikel, supaya
 * data yang sudah ter-cache di /artikel, /bidan/artikel & /dinkes/review-artikel
 * ikut terinvalidasi.
 */
export function clearGraphQLCache(): void {
  cache.clear();
}

async function attemptSessionRefresh(): Promise<boolean> {
  try {
    // Reuse refresh + onUnauthorized milik lib/api.ts agar tetap single-flight.
    await apiPost('/auth/refresh');
    return true;
  } catch {
    return false;
  }
}

/**
 * Menjalankan satu operasi GraphQL.
 *
 * @param query     dokumen query/mutation
 * @param variables variabel operasi
 * @param opts.skipCache matikan cache (dipakai mutation)
 * @param opts.skipRefresh matikan percobaan refresh otomatis saat 401
 */
export async function gqlRequest<TData>(
  query: string,
  variables?: Record<string, unknown>,
  opts: { skipCache?: boolean; skipRefresh?: boolean } = {},
): Promise<TData> {
  const { skipCache = false, skipRefresh = false } = opts;
  const cacheKey = `${query}::${JSON.stringify(variables ?? {})}`;

  if (!skipCache) {
    const cached = getCached<TData>(cacheKey);
    if (cached) return cached;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  let res: Response;
  try {
    res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: variables ?? {} }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new GraphQLError('Permintaan ke server terlalu lama.', 'internal', 504);
    }
    throw new GraphQLError(
      'Tidak dapat terhubung ke server. Pastikan backend SiGizi berjalan.',
      'internal',
      503,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (res.status === 401 && !skipRefresh) {
    if (await attemptSessionRefresh()) {
      return gqlRequest<TData>(query, variables, { ...opts, skipRefresh: true });
    }
  }

  let json: GraphQLResponse<TData>;
  try {
    json = (await res.json()) as GraphQLResponse<TData>;
  } catch {
    throw new GraphQLError('Respons server tidak valid.', 'internal', 502);
  }

  if (json.errors?.length) {
    throw toGraphQLError(json.errors[0]);
  }
  if (!json.data) {
    throw new GraphQLError('Respons server tidak berisi data.', 'internal', 502);
  }

  if (!skipCache) setCache(cacheKey, json.data);
  return json.data;
}
