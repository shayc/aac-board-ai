import type { Theme } from "@mui/material/styles";

// A width breakpoint cannot see a screen that is wide but short, such as a
// phone on its side. The `sm` value keeps the threshold on the theme's scale.
// Portrait screens are excluded so a small upright phone keeps its own layout.
export function shortLandscape(theme: Theme): string {
  const maxHeight = theme.breakpoints.values.sm - 0.05;

  return `@media (orientation: landscape) and (max-height:${maxHeight}px)`;
}
