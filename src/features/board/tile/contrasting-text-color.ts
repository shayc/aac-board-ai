const EQUAL_CONTRAST_OKLCH_LIGHTNESS = 0.564;

export function blackOrWhiteOn(color: string): string {
  return `oklch(from ${color} clamp(0, (${EQUAL_CONTRAST_OKLCH_LIGHTNESS} - l) * 1000, 1) 0 0 / 1)`;
}
