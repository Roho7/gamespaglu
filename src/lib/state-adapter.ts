/**
 * All game state goes through this interface. v1 ships only the `local`
 * implementation (localStorage). When rooms arrive, a `remote` implementation
 * (Supabase) satisfies the same contract and nothing above it changes.
 */
export type StateAdapter = {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
};

const PREFIX = "gp:";

export const localAdapter: StateAdapter = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;
    try {
      const raw = window.localStorage.getItem(PREFIX + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* private mode, quota — losing a preference is not worth a crash */
    }
  },
  remove(key: string) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(PREFIX + key);
    } catch {
      /* ignore */
    }
  },
};

export const store = localAdapter;
