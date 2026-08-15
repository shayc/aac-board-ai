type SafeAreaSide = "top" | "right" | "bottom" | "left";

/**
 * Returns the CSS safe-area inset for one edge. Use for full-bleed content or
 * when base spacing is supplied elsewhere.
 */
export function safeAreaInset(side: SafeAreaSide): string {
  return `env(safe-area-inset-${side})`;
}

/**
 * Adds the safe-area inset to a base gutter. Addition is intentional: `env()`
 * alone omits the base gutter, while `max()` preserves only the larger term.
 */
export function safeAreaGutter(
  base: string | number,
  side: SafeAreaSide,
): string {
  const length = typeof base === "number" ? `${base}px` : base;
  return `calc(${length} + ${safeAreaInset(side)})`;
}
