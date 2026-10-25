export const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** One property of an untrusted payload, or undefined when the payload is not an object. */
export const field = (v: unknown, key: string): unknown => (isRecord(v) ? v[key] : undefined);
