import type { Theme } from "@mui/material/styles";
import type { CSSProperties } from "react";

const BOARD_BRIGHTNESS = "var(--board-brightness, 1)";

export type BoardBrightnessStyle = CSSProperties & {
  "--board-brightness"?: number;
};

export const symbolBrightnessFilter = `brightness(${BOARD_BRIGHTNESS})`;

// The same per-channel multiplication as the symbol's `brightness()` filter,
// so a symbol and the surface behind it dim by exactly the same amount.
export function dim(color: string): string {
  const dimmed = (channel: "r" | "g" | "b") =>
    `calc(${channel} * ${BOARD_BRIGHTNESS})`;

  return `rgb(from ${color} ${dimmed("r")} ${dimmed("g")} ${dimmed("b")} / alpha)`;
}

// Tiles are buttons, whose colors ease with the theme's button feedback timing.
// Everything else that dims uses the same timing, so a brightness change moves
// symbols and surfaces in step instead of the symbols jumping ahead.
export function brightnessTransition(
  theme: Theme,
  properties: string[],
): string {
  return theme.transitions.create(properties, {
    duration: theme.transitions.duration.shortest,
    easing: theme.transitions.easing.easeOut,
  });
}
