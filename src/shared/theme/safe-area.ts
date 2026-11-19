type SafeAreaSide = "top" | "right" | "bottom" | "left";

export function safeAreaInset(side: SafeAreaSide): string {
  return `env(safe-area-inset-${side})`;
}

// Added: beside a notch or island, content keeps its gutter past the inset.
export function safeAreaGutter(
  base: string | number,
  side: SafeAreaSide,
): string {
  return `calc(${toLength(base)} + ${safeAreaInset(side)})`;
}

// The larger of the two: the home indicator's inset is already margin enough,
// as iOS's own bars sit inside it.
export function overlappingSafeAreaGutter(
  base: string | number,
  side: SafeAreaSide,
): string {
  return `max(${toLength(base)}, ${safeAreaInset(side)})`;
}

function toLength(base: string | number): string {
  return typeof base === "number" ? `${base}px` : base;
}
