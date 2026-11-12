type SafeAreaSide = "top" | "right" | "bottom" | "left";

export function safeAreaInset(side: SafeAreaSide): string {
  return `env(safe-area-inset-${side})`;
}

// Addition is intentional: max() would drop the base gutter wherever the inset
// is larger.
export function safeAreaGutter(
  base: string | number,
  side: SafeAreaSide,
): string {
  const length = typeof base === "number" ? `${base}px` : base;

  return `calc(${length} + ${safeAreaInset(side)})`;
}
