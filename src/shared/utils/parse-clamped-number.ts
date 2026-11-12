export interface ClampedNumberOptions {
  min: number;
  max: number;
  defaultValue: number;
}

export function parseClampedNumber(
  value: unknown,
  { min, max, defaultValue }: ClampedNumberOptions,
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return defaultValue;
  }

  return Math.min(Math.max(value, min), max);
}
