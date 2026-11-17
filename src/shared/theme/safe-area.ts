type SafeAreaSide = "top" | "right" | "bottom" | "left";

export function safeAreaInset(side: SafeAreaSide): string {
  return `env(safe-area-inset-${side})`;
}

// Add to the inset rather than taking max() so the base gutter is preserved.
export function safeAreaGutter(
  base: string | number,
  side: SafeAreaSide,
): string {
  const length = typeof base === "number" ? `${base}px` : base;

  return `calc(${length} + ${safeAreaInset(side)})`;
}
