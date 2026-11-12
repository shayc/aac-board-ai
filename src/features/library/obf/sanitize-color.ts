// Imported colors are interpolated into CSS expressions.
export function sanitizeColor(color: string | undefined): string | undefined {
  if (color === undefined) {
    return undefined;
  }

  return CSS.supports("color", color) ? color : undefined;
}
