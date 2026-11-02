import type { Theme } from "@mui/material/styles";

/**
 * The single 1px edge used across the chrome. Drawn as an inset box-shadow so
 * it never changes layout; `bottom` draws only the lower edge (app bar).
 */
export function hairline(theme: Theme, edge: "all" | "bottom" = "all"): string {
  const color = (theme.vars ?? theme).palette.divider;

  return edge === "bottom"
    ? `inset 0 -1px 0 ${color}`
    : `inset 0 0 0 1px ${color}`;
}

/**
 * MUI's hover strength (`action.hoverOpacity`) mixed into a solid color, so
 * hover transitions like other buttons instead of snapping like an overlay.
 */
export function hoverTint(theme: Theme, color: string): string {
  const palette = (theme.vars ?? theme).palette;
  // Opaque ink (unlike text.primary), so the result stays fully opaque.
  const ink =
    theme.vars?.palette.common.onBackground ??
    (theme.palette.mode === "dark" ? "#fff" : "#000");

  return `color-mix(in srgb, ${ink} calc(${palette.action.hoverOpacity} * 100%), ${color})`;
}
