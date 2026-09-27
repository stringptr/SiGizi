import { clearGraphQLCache } from './graphql';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/v1';

let onUnauthorized: (() => void) | null = null;
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

const CACHE_TTL = 600000; // 10 minutes
const cache = new Map<string, { data: unknown; timestamp: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCache(): void {
  cache.clear();
  // Mutations REST juga mengubah data yang dibaca halaman GraphQL (mis. artikel
  // di /edukasi), jadi cache GraphQL ikut dikosongkan.
  clearGraphQLCache();
}

export function setOnUnauthorized(cb: () => void) {
  onUnauthorized = cb;
}

export interface ApiResponse<T> {
  status: number;
  success: boolean;
  data?: T;
  errors?: ApiErrorItem[];
  detail?: string;
  title?: string;
}

export interface ApiErrorItem {
  id: string;
  location?: string;
  message: string;
  value?: unknown;
}

export interface PaginatedMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface PaginatedData {
  meta: PaginatedMeta;
}

export class ApiError extends Error {
  status: number;
  errors: ApiErrorItem[];
  detail: string;
  title: string;

  constructor(res: ApiResponse<unknown>) {
    super(res.detail || res.title || 'Terjadi kesalahan');
    this.status = res.status;
    this.errors = res.errors || [];
    this.detail = res.detail || '';
    this.title = res.title || '';
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response, skipRefresh = false): Promise<T> {
  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    if (response.status === 401 && !skipRefresh) {
      const refreshed = await attemptRefresh();
      if (refreshed) {
        throw new RetryError();
      }
    }
    throw new ApiError(json);
  }

  return json.data as T;
}

class RetryError extends Error {
  constructor() {
    super('Retry');
    this.name = 'RetryError';
  }
}

async function attemptRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return res.ok;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  const success = await refreshPromise;
  if (!success && onUnauthorized) {
    onUnauthorized();
  }
  return success;
}

const REQUEST_TIMEOUT = 30000;

async function request<T>(method: string, path: string, body?: unknown, params?: Record<string, string>, retries = 1): Promise<T> {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const search = new URLSearchParams(params);
    url += `?${search}`;
  }

  const cacheKey = `${method}:${url}`;

  if (method === 'GET') {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(url, {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    try {
      const data = await handleResponse<T>(res);
      if (method === 'GET') {
        setCache(cacheKey, data);
      } else {
        clearCache();
      }
      return data;
    } catch (err) {
      if (err instanceof RetryError && retries > 0) {
        return request<T>(method, path, body, params, retries - 1);
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  return request<T>('GET', path, undefined, params);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PATCH', path, body);
}

export async function apiDelete<T>(path: string): Promise<T> {
  return request<T>('DELETE', path);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PUT', path, body);
}
