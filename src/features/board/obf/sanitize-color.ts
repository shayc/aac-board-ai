/**
 * Returns `color` only when the browser accepts it for the CSS `color`
 * property. This rejects declaration-breakout strings before untrusted board
 * colors are embedded in derived CSS.
 */
export function sanitizeColor(color: string | undefined): string | undefined {
  if (color === undefined) {
    return undefined;
  }

  return CSS.supports("color", color) ? color : undefined;
}
