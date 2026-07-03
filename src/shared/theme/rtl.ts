import type { Theme } from "@mui/material/styles";

/**
 * sx helper that mirrors an element on the X axis when the theme direction is
 * RTL. Intended for directional icons (arrows, backspace, play, etc.).
 *
 * Usage:
 *   <ArrowBackOutlinedIcon sx={flipForRtl} />
 *   <PlayArrowIcon sx={[flipForRtl, { width: 48, height: 48 }]} />
 */
export const flipForRtl = (theme: Theme) =>
  theme.direction === "rtl" ? { transform: "scaleX(-1)" } : {};

/**
 * sx helper that mirrors an element on the X axis when the theme direction is
 * LTR. Intended for icons that are inherently asymmetric but happen to read
 * correctly unflipped in RTL (e.g. a sidebar icon depicting a left-hand rail).
 *
 * Usage:
 *   <ViewSidebarOutlinedIcon sx={flipForLtr} />
 */
export const flipForLtr = (theme: Theme) =>
  theme.direction === "ltr" ? { transform: "scaleX(-1)" } : {};
