// Migration note: Vended from WarrantyWeasel shared-infra v1.0.0
// Cache interface with TTL

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: string;
}

export interface CacheInterface {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttlMs: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
}

const cacheStore = new Map<string, CacheEntry<unknown>>();

export const memoryCache: CacheInterface = {
  get<T>(key: string): T | null {
    const entry = cacheStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      cacheStore.delete(key);
      return null;
    }
    return entry.value as T;
  },

  set<T>(key: string, value: T, ttlMs: number): void {
    cacheStore.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: new Date().toISOString(),
    });
  },

  has(key: string): boolean {
    const entry = cacheStore.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      cacheStore.delete(key);
      return false;
    }
    return true;
  },

  delete(key: string): boolean {
    return cacheStore.delete(key);
  },

  clear(): void {
    cacheStore.clear();
  },
};

export const DEFAULT_CACHE_TTL_MS = 300_000; // 5 minutes
