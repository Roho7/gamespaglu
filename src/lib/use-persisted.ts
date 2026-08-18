"use client";

import { useCallback, useSyncExternalStore } from "react";
import { store } from "./state-adapter";

/**
 * localStorage is an external store, so it is read through
 * useSyncExternalStore rather than copied into state inside an effect. Parsed
 * values are cached so snapshots stay referentially stable between renders —
 * without the cache, React would re-render forever.
 *
 * The server snapshot is the fallback, so SSR and the first client render agree
 * and React swaps in the real value immediately after hydration.
 */
const cache = new Map<string, unknown>();
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

function read<T>(key: string, fallback: T): T {
  if (!cache.has(key)) cache.set(key, store.get<T>(key, fallback));
  return cache.get(key) as T;
}

export function writePersisted<T>(key: string, value: T) {
  cache.set(key, value);
  store.set(key, value);
  emit();
}

export function usePersisted<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    subscribe,
    () => read<T>(key, fallback),
    () => fallback,
  );
  const set = useCallback(
    (next: T) => writePersisted(key, next),
    [key],
  );
  return [value, set] as const;
}

/** True only once the client has taken over — for anything that must not SSR. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
