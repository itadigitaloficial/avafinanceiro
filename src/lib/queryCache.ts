const CACHE_PREFIX = "ava_cache_";

export function getCachedData<T>(key: string): T | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const { data, timestamp } = JSON.parse(raw);
    // Cache valid for 10 minutes
    if (Date.now() - timestamp > 10 * 60 * 1000) return undefined;
    return data as T;
  } catch {
    return undefined;
  }
}

export function setCachedData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(
      CACHE_PREFIX + key,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // localStorage full, ignore
  }
}
