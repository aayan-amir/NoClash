/**
 * Safe localStorage wrapper with try/catch and corruption handling.
 * If storage is unavailable or disabled, gracefully falls back to an in-memory map.
 */

const memoryFallback = new Map<string, string>();

export const cache = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch (_err) {
      // If parsing fails (corrupt data) or localStorage is restricted, clean up key
      try {
        localStorage.removeItem(key);
      } catch (_e) {
        // Ignore
      }
      return null;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return true;
    } catch (_err) {
      try {
        memoryFallback.set(key, JSON.stringify(value));
      } catch (_e) {
        // Ignore
      }
      return false;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (_err) {
      // Ignore
    }
    memoryFallback.delete(key);
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (_err) {
      // Ignore
    }
    memoryFallback.clear();
  },
};
