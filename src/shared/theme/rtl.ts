import type { Theme } from "@mui/material/styles";

/** Mirrors directional icons such as Back and Backspace on the X axis in RTL. */
export const flipForRtl = (theme: Theme) =>
  theme.direction === "rtl" ? { transform: "scaleX(-1)" } : {};

/**
 * Mirrors on the X axis in LTR when the source artwork already has its RTL
 * orientation, such as `ViewSidebarOutlined` and its right-hand rail.
 */
export const flipForLtr = (theme: Theme) =>
  theme.direction === "ltr" ? { transform: "scaleX(-1)" } : {};
