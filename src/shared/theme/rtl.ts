import type { Theme } from "@mui/material/styles";

/** Mirrors on the X axis in RTL — for directional icons (arrows, backspace, play). */
export const flipForRtl = (theme: Theme) =>
  theme.direction === "rtl" ? { transform: "scaleX(-1)" } : {};

/**
 * Mirrors on the X axis in LTR — for asymmetric icons that already read
 * correctly in RTL (e.g. a sidebar icon depicting a left-hand rail).
 */
export const flipForLtr = (theme: Theme) =>
  theme.direction === "ltr" ? { transform: "scaleX(-1)" } : {};
