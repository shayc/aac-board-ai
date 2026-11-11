import { assertDefined } from "./assert-defined";

type RGB = readonly [red: number, green: number, blue: number];

/**
 * WCAG contrast ratio between two opaque CSS colors. The browser resolves the
 * colors, so any syntax a computed style returns is accepted.
 */
export function contrastRatio(color: string, otherColor: string): number {
  const luminances = [color, otherColor].map((value) =>
    relativeLuminance(resolveColor(value)),
  );
  const lighter = Math.max(...luminances);
  const darker = Math.min(...luminances);

  return (lighter + 0.05) / (darker + 0.05);
}

function resolveColor(color: string): RGB {
  const context = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  assertDefined(context);

  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;

  return [red, green, blue];
}

function relativeLuminance(rgb: RGB): number {
  const [red, green, blue] = rgb.map((channel) => {
    const value = channel / 255;

    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }) as unknown as RGB;

  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
