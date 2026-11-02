import { buttonClasses } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
import { EDIT_DARK, EDIT_LIGHT } from "@shared/theme/theme-colors";

// Quiet chrome for back, home and backspace, so the grid and the speak button
// stay the loudest things on screen. Same flat surface + hairline as the
// message bar.
// MUI's hover strength, as a solid color so it transitions like other buttons.
function hoverTint(theme: Theme, color: string): string {
  const palette = (theme.vars ?? theme).palette;

  return `color-mix(in srgb, ${palette.text.primary} calc(${palette.action.hoverOpacity} * 100%), ${color})`;
}

export function controlButtonSx(theme: Theme) {
  const palette = (theme.vars ?? theme).palette;
  const hairline = `inset 0 0 0 1px ${palette.divider}`;

  return {
    width: 72,
    color: palette.text.secondary,
    backgroundColor: palette.background.paper,
    boxShadow: hairline,
    // Contained buttons raise on hover, press and focus; keep them flat.
    [`&:hover, &:active, &.${buttonClasses.focusVisible}`]: {
      boxShadow: hairline,
    },
    "&:hover": {
      backgroundColor: hoverTint(theme, palette.background.paper),
    },
    // MUI clears shadows on disabled buttons; keep the hairline so the shape
    // stays put and only the fill and icon dim.
    [`&.${buttonClasses.disabled}`]: {
      backgroundColor: "transparent",
      boxShadow: hairline,
    },
  };
}

// Backspace edits the message, so it gets an amber fill, distinct from
// navigation (neutral) and speaking (primary). Disabled stays neutral.
// Apply after controlButtonSx: sx={[controlButtonSx, backspaceAccentSx]}.
export function backspaceAccentSx(theme: Theme) {
  return {
    [`&:not(.${buttonClasses.disabled})`]: {
      color: EDIT_LIGHT.ink,
      backgroundColor: EDIT_LIGHT.fill,
      "&:hover": {
        backgroundColor: hoverTint(theme, EDIT_LIGHT.fill),
      },
    },
    ...theme.applyStyles("dark", {
      [`&:not(.${buttonClasses.disabled})`]: {
        color: EDIT_DARK.ink,
        backgroundColor: EDIT_DARK.fill,
        "&:hover": {
          backgroundColor: hoverTint(theme, EDIT_DARK.fill),
        },
      },
    }),
  };
}
