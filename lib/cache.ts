import type { CacheEntry, GitHubUserStats } from './types';

const DEFAULT_TTL_MILLISECONDS = 24 * 60 * 60 * 1000;
const MEMORY_CACHE: Map<string, CacheEntry> = new Map();

export function getCachedStats(username: string): GitHubUserStats | null {
  const entry = MEMORY_CACHE.get(username.toLowerCase());

  if (!entry) {
    return null;
  }

  if (entry.expiresAt < Date.now()) {
    MEMORY_CACHE.delete(username.toLowerCase());
    return null;
  }

  return entry.data;
}

export function setCachedStats(stats: GitHubUserStats, ttl: number = DEFAULT_TTL_MILLISECONDS): void {
  const entry: CacheEntry = {
    data: stats,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  };

  MEMORY_CACHE.set(stats.username.toLowerCase(), entry);
}

export function clearCache(username?: string): void {
  if (username) {
    MEMORY_CACHE.delete(username.toLowerCase());
  } else {
    MEMORY_CACHE.clear();
  }
}

export function getCacheStats() {
  return {
    size: MEMORY_CACHE.size,
    keys: Array.from(MEMORY_CACHE.keys()),
  };
}
