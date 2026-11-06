export interface ClampedNumberOptions {
  min: number;
  max: number;
  normalValue: number;
}

export function parseClampedNumber(
  value: unknown,
  { min, max, normalValue }: ClampedNumberOptions,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return normalValue;
  }

  return Math.min(Math.max(value, min), max);
}
