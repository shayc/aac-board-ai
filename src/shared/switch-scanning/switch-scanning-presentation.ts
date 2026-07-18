import type { Theme } from "@mui/material/styles";
import "@shayc/switch-scanning/styles.css";

const highlightedTargetSelector =
  "&[data-switch-scanning-scope] [data-scan-highlighted]";

export const switchScanningSx = (theme: Theme) => ({
  "--scan-outline-width": "4px",
  "--scan-outline-offset": "2px",
  "--scan-within-width": "3px",
  "--scan-within-offset": "2px",
  [highlightedTargetSelector]: {
    outline:
      "var(--scan-outline-width) solid var(--scan-outline-color, CanvasText)",
    outlineOffset: "var(--scan-outline-offset)",
  },
  "@media (forced-colors: none)": {
    "--scan-outline-color":
      theme.vars?.palette.primary.main ?? theme.palette.primary.main,
    "--scan-within-color": "var(--scan-outline-color)",
  },
});
