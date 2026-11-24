import type { Theme } from "@mui/material/styles";

export function shortLandscape(theme: Theme): string {
  const maxHeight = theme.breakpoints.values.sm - 0.05;

  return `@media (orientation: landscape) and (max-height:${maxHeight}px)`;
}
