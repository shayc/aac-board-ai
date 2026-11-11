import { assertDefined } from "./assert-defined";

type RGB = readonly [red: number, green: number, blue: number];

/**
 * WCAG contrast ratio of a CSS color against an opaque backdrop. The browser
 * resolves the colors, so any syntax a computed style returns is accepted,
 * and a translucent color is measured as it looks over the backdrop.
 */
export function contrastRatio(color: string, backdrop: string): number {
  const context = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });
  assertDefined(context);

  const backdropLuminance = relativeLuminance(paint(context, backdrop));
  const colorLuminance = relativeLuminance(paint(context, color));
  const lighter = Math.max(backdropLuminance, colorLuminance);
  const darker = Math.min(backdropLuminance, colorLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

/** Paints over what is already on the canvas and reads the result back. */
function paint(context: CanvasRenderingContext2D, color: string): RGB {
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
