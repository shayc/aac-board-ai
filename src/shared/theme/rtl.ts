import type { Theme } from "@mui/material/styles";

/**
 * sx helper that mirrors an element on the X axis when the theme direction is
 * RTL. Intended for directional icons (arrows, backspace, play, etc.).
 *
 * Usage:
 *   <ArrowBackOutlinedIcon sx={flipForRtl} />
 *   <PlayArrowIcon sx={[flipForRtl, { width: 48, height: 48 }]} />
 */
export const flipForRtl = (theme: Theme) => ({
  transform: theme.direction === "rtl" ? "scaleX(-1)" : "none",
});
