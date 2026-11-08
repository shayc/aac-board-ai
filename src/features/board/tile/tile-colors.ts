import type { CSSProperties } from "react";

type TileColorStyle = CSSProperties & {
  "--tile-background-color"?: string;
  "--tile-border-color"?: string;
};

interface TileColorOptions {
  backgroundColor: string | undefined;
  borderColor: string | undefined;
  isBorderVisible: boolean;
  saturation: number;
}

export function tileColorStyle({
  backgroundColor,
  borderColor,
  isBorderVisible,
  saturation,
}: TileColorOptions): TileColorStyle {
  const visibleBorderColor = isBorderVisible ? borderColor : undefined;

  return {
    "--tile-background-color":
      backgroundColor &&
      desaturate(flattenOntoWhite(backgroundColor), saturation),
    "--tile-border-color":
      visibleBorderColor && desaturate(visibleBorderColor, saturation),
  };
}

export function mixWithTextColor(color: string, amount: string): string {
  return `color-mix(in oklab, ${color}, currentColor ${amount})`;
}

function flattenOntoWhite(color: string): string {
  return `rgb(from ${color} ${channelOntoWhite("r")} ${channelOntoWhite("g")} ${channelOntoWhite("b")} / 1)`;
}

function channelOntoWhite(channel: "r" | "g" | "b"): string {
  return `calc(${channel} * alpha + 255 * (1 - alpha))`;
}

function desaturate(color: string, saturation: number): string {
  return `oklch(from ${color} l calc(c * ${saturation}) h)`;
}
