import { assertDefined } from "@shared/testing/assert-defined";
import { expect } from "vitest";

export type Rgb = readonly [red: number, green: number, blue: number];

export function paint(...cssColors: string[]): Rgb {
  const context = new OffscreenCanvas(1, 1).getContext("2d");
  assertDefined(context);

  for (const cssColor of cssColors) {
    context.fillStyle = cssColor;
    context.fillRect(0, 0, 1, 1);
  }

  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
  assertDefined(red);
  assertDefined(green);
  assertDefined(blue);
  expect(alpha, `painting ${cssColors.join(", ")} must end opaque`).toBe(255);

  return [red, green, blue];
}

function linearizeChannel(channel: number): number {
  const value = channel / 255;

  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance([red, green, blue]: Rgb): number {
  return (
    0.2126 * linearizeChannel(red) +
    0.7152 * linearizeChannel(green) +
    0.0722 * linearizeChannel(blue)
  );
}

export function contrastRatio(first: Rgb, second: Rgb): number {
  const firstLuminance = relativeLuminance(first) + 0.05;
  const secondLuminance = relativeLuminance(second) + 0.05;

  return (
    Math.max(firstLuminance, secondLuminance) /
    Math.min(firstLuminance, secondLuminance)
  );
}
