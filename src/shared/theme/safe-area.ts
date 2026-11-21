type SafeAreaSide = "top" | "right" | "bottom" | "left";

export function safeAreaInset(side: SafeAreaSide): string {
  return `env(safe-area-inset-${side})`;
}

// For an inset that hardware fills, such as a notch or island: the gutter
// starts past it.
export function safeAreaGutter(
  base: string | number,
  side: SafeAreaSide,
): string {
  return `calc(${toLength(base)} + ${safeAreaInset(side)})`;
}

// For an inset that only a gesture area fills, such as the home indicator:
// content may sit inside it, as iOS's own bars do.
export function maxSafeAreaGutter(
  base: string | number,
  side: SafeAreaSide,
): string {
  return `max(${toLength(base)}, ${safeAreaInset(side)})`;
}

function toLength(base: string | number): string {
  return typeof base === "number" ? `${base}px` : base;
}
