/**
 * Returns the color only if the browser parses it as a valid CSS <color>,
 * otherwise undefined. Guards against untrusted values that get interpolated
 * into CSS declarations: validating with the browser's own parser rejects
 * breakout payloads like "x); } a { background-image: url(...) }".
 */
export function sanitizeColor(color: string | undefined): string | undefined {
  if (color === undefined) {
    return undefined;
  }

  return CSS.supports("color", color) ? color : undefined;
}
