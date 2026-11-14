function fnv1a(seed: string): number {
  let h = 2166136261;
  for (const ch of seed) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}


export function whimsy<T>(pool: readonly T[], seed: string): T {
  return pool[fnv1a(seed) % pool.length];
}

export function fill(template: string, slots: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) => slots[key] ?? whole);
}
