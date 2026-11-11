import type { Theme } from "@mui/material/styles";
import { buttonFeedbackTransition } from "@shared/theme/button-feedback";
import type { CSSProperties } from "react";

const BRIGHTNESS = "var(--board-brightness, 1)";

export type BoardBrightnessStyle = CSSProperties & {
  "--board-brightness"?: number;
};

export const symbolBrightnessFilter = `brightness(${BRIGHTNESS})`;

// The same per-channel multiplication as the symbol's `brightness()` filter,
// so a symbol and the surface behind it dim by exactly the same amount.
export function dim(color: string): string {
  const dimmed = (channel: "r" | "g" | "b") =>
    `calc(${channel} * ${BRIGHTNESS})`;

  return `rgb(from ${color} ${dimmed("r")} ${dimmed("g")} ${dimmed("b")} / alpha)`;
}

// A dimmed surface with the label color that stays readable on it.
export function dimmedSurface(color: string) {
  const backgroundColor = dim(color);

  return {
    color: `contrast-color(${backgroundColor})`,
    backgroundColor,
  };
}

// Tiles are buttons, so their colors ease with the theme's button feedback.
// Everything else that dims eases the same way, so a brightness change moves
// symbols and surfaces in step instead of the symbols jumping ahead.
export function brightnessTransition(
  theme: Theme,
  properties: string[],
): string {
  return buttonFeedbackTransition(theme, properties);
}
