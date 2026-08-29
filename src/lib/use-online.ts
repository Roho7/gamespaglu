"use client";

import { useSyncExternalStore } from "react";

/**
 * Is the device on a network at all?
 *
 * Read through useSyncExternalStore for the same reason localStorage is: it is
 * an external store, and copying it into state inside an effect gives a first
 * render that disagrees with reality.
 *
 * The server snapshot is `true`, so SSR and hydration agree and a genuinely
 * offline device corrects itself immediately afterwards. Being briefly wrong in
 * the optimistic direction is right: flashing "no signal" at somebody who is
 * fine is worse than being half a frame late.
 */
function subscribe(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

export function useOnline() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
