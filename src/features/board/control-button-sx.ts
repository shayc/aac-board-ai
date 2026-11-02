import { buttonClasses } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
import { hairline, hoverTint } from "@shared/theme/surface";
import { EDIT_DARK, EDIT_LIGHT } from "@shared/theme/theme-colors";

// Quiet chrome for back, home and backspace, so the grid and the speak button
// stay the loudest things on screen: the same flat surface and hairline as the
// message bar, in every state.
export function controlButtonSx(theme: Theme) {
  const palette = (theme.vars ?? theme).palette;

  return {
    width: 72,
    color: palette.action.active,
    backgroundColor: palette.background.paper,
    // Contained buttons raise on hover, press and focus, and MUI clears the
    // shadow when disabled; keep the hairline so only fill and icon change.
    [`&, &:hover, &:active, &.${buttonClasses.focusVisible}, &.${buttonClasses.disabled}`]:
      { boxShadow: hairline(theme) },
    "&:hover": {
      backgroundColor: hoverTint(theme, palette.background.paper),
    },
    [`&.${buttonClasses.disabled}`]: {
      backgroundColor: "transparent",
    },
  };
}

// Backspace edits the message, so it gets an amber fill, distinct from
// navigation (neutral) and speaking (primary). Disabled stays neutral.
// Amber is a plain constant rather than a palette color: it has one use, and
// a custom palette entry would need TypeScript module augmentation.
// Apply after controlButtonSx: sx={[controlButtonSx, backspaceAccentSx]}.
export function backspaceAccentSx(theme: Theme) {
  const accent = (edit: typeof EDIT_LIGHT) => ({
    [`&:not(.${buttonClasses.disabled})`]: {
      color: edit.ink,
      backgroundColor: edit.fill,
      "&:hover": {
        backgroundColor: hoverTint(theme, edit.fill),
      },
    },
  });

  return {
    ...accent(EDIT_LIGHT),
    ...theme.applyStyles("dark", accent(EDIT_DARK)),
  };
}
