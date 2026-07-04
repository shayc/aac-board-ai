type SafeAreaSide = "top" | "right" | "bottom" | "left";

/**
 * The raw device safe-area inset for one edge — `0` when there is nothing to
 * clear (no notch, rounded corner, or home indicator). Use for full-bleed
 * content that has no gutter of its own, or when the base gutter is supplied by
 * an ancestor.
 */
export function safeAreaInset(side: SafeAreaSide): string {
  return `env(safe-area-inset-${side})`;
}

/**
 * A gutter that keeps its base length and grows to also clear the device
 * safe-area inset. Additive on purpose: bare `env()` drops the gutter when
 * there is no inset (portrait), and `max()` drops it right beside a notch —
 * this keeps the gutter AND clears the inset in every orientation.
 */
export function safeAreaGutter(
  base: string | number,
  side: SafeAreaSide,
): string {
  const length = typeof base === "number" ? `${base}px` : base;
  return `calc(${length} + ${safeAreaInset(side)})`;
}
