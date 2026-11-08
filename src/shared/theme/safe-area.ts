type SafeAreaSide = "top" | "right" | "bottom" | "left";

export function safeAreaInset(side: SafeAreaSide): string {
  return `env(safe-area-inset-${side})`;
}

// `env()` alone omits the base gutter, and `max()` keeps only the larger term.
export function safeAreaGutter(
  base: string | number,
  side: SafeAreaSide,
): string {
  const length = typeof base === "number" ? `${base}px` : base;
  return `calc(${length} + ${safeAreaInset(side)})`;
}
