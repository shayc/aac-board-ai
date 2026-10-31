export interface ClampedNumberOptions {
  min: number;
  max: number;
  fallback: number;
}

export function parseClampedNumber(
  value: unknown,
  { min, max, fallback }: ClampedNumberOptions,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(value, min), max);
}
