type SafeAreaSide = "top" | "right" | "bottom" | "left";

export function safeAreaInset(side: SafeAreaSide): string {
  return `env(safe-area-inset-${side})`;
}

export function safeAreaGutter(
  base: string | number,
  side: SafeAreaSide,
): string {
  return `calc(${toLength(base)} + ${safeAreaInset(side)})`;
}

export function maxSafeAreaGutter(
  base: string | number,
  side: SafeAreaSide,
): string {
  return `max(${toLength(base)}, ${safeAreaInset(side)})`;
}

function toLength(base: string | number): string {
  return typeof base === "number" ? `${base}px` : base;
}
