// A plain object (not null and not an array), the shape every stored record must have before its
// fields are read.
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
