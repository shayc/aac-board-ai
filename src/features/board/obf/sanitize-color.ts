// Untrusted board colors are embedded in derived CSS, so declaration-breakout
// strings must be rejected first.
export function sanitizeColor(color: string | undefined): string | undefined {
  if (color === undefined) {
    return undefined;
  }

  return CSS.supports("color", color) ? color : undefined;
}
