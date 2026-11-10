import type { Theme } from "@mui/material/styles";
import { SCAN_HIGHLIGHT_ATTRIBUTE } from "./switch-scanner";

const BAND_WIDTH_PX = 3;

/**
 * The scan highlight, for the element that contains every scan group. Tiles
 * carry arbitrary colors from the board file, so the ring has a light and a
 * dark band: one of them always contrasts with what is behind it. It is a
 * box shadow so the focus ring, an outline, stays visible on the same element.
 */
export function scanHighlightSx(theme: Theme) {
  const innerBand = theme.vars.palette.background.default;
  const outerBand = theme.vars.palette.text.primary;

  return {
    // Doubled to outrank the state rules (hover, focus) of the highlighted
    // buttons, which set their own shadows.
    [`&& [${SCAN_HIGHLIGHT_ATTRIBUTE}]`]: {
      boxShadow: `0 0 0 ${BAND_WIDTH_PX}px ${innerBand}, 0 0 0 ${2 * BAND_WIDTH_PX}px ${outerBand}`,
    },
  };
}
