import { buttonClasses } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";

// Quiet, outlined chrome for back, home and backspace, so the grid and the
// speak button stay the loudest things on screen.
export function controlButtonSx(theme: Theme) {
  const palette = (theme.vars ?? theme).palette;

  return {
    width: 72,
    color: palette.text.secondary,
    backgroundColor: palette.common.white,
    boxShadow: `inset 0 0 0 1px ${palette.divider}, 0 1px 2px rgb(0 0 0 / 0.08)`,
    "&:hover": {
      backgroundColor: palette.grey[100],
      boxShadow: `inset 0 0 0 1px ${palette.divider}, 0 1px 3px rgb(0 0 0 / 0.12)`,
    },
    [`&.${buttonClasses.disabled}`]: {
      backgroundColor: "transparent",
      boxShadow: `inset 0 0 0 1px ${palette.divider}`,
    },
    ...theme.applyStyles("dark", {
      backgroundColor: "#262a31",
      "&:hover": {
        backgroundColor: "#2f343c",
      },
    }),
  };
}

// Backspace edits the message, so it gets its own amber "edit" color, distinct
// from navigation (neutral) and speaking (primary). Disabled stays neutral.
// Apply after controlButtonSx: sx={[controlButtonSx, backspaceAccentSx]}.
export function backspaceAccentSx(theme: Theme) {
  return {
    [`&:not(.${buttonClasses.disabled})`]: {
      color: "#6b4500",
      backgroundColor: "#ffe0b2",
      boxShadow: "inset 0 0 0 1.5px #c98a2b, 0 1px 2px rgb(0 0 0 / 0.1)",
      "&:hover": {
        backgroundColor: "#ffd59a",
      },
    },
    ...theme.applyStyles("dark", {
      [`&:not(.${buttonClasses.disabled})`]: {
        color: "#ffd180",
        backgroundColor: "#5a4214",
        boxShadow: "0 1px 2px rgb(0 0 0 / 0.3)",
        "&:hover": {
          backgroundColor: "#6a4e18",
        },
      },
    }),
  };
}
