import { buttonClasses } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
import { EDIT_DARK, EDIT_LIGHT } from "@shared/theme/theme-colors";

// Quiet chrome for back, home and backspace, so the grid and the speak button
// stay the loudest things on screen. Same flat surface + hairline as the
// message bar.
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
      backgroundColor: palette.background.paper,
      backgroundImage: `linear-gradient(${palette.action.hover}, ${palette.action.hover})`,
    },
    [`&.${buttonClasses.disabled}`]: {
      backgroundColor: "transparent",
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
        backgroundColor: EDIT_LIGHT.fill,
      },
    },
    ...theme.applyStyles("dark", {
      [`&:not(.${buttonClasses.disabled})`]: {
        color: EDIT_DARK.ink,
        backgroundColor: EDIT_DARK.fill,
        "&:hover": {
          backgroundColor: EDIT_DARK.fill,
        },
      },
    }),
  };
}
