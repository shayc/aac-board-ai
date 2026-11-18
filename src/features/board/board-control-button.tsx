import Button, { buttonClasses, type ButtonProps } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
import { svgIconClasses } from "@mui/material/SvgIcon";
import { shortLandscape } from "@shared/theme/short-landscape";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { mergeSx } from "@shared/ui/merge-sx";
import { CONTROL_ICON_SIZE, CONTROL_SIZES } from "./board-control-sizes";
import { MIN_CELL_WIDTH_PX } from "./grid/grid-layout";

const SHAPE_SX = {
  // The grid's narrowest tile; three plus their gaps fill a 320px phone.
  pill: { width: MIN_CELL_WIDTH_PX },
  // One icon: no side padding, and as wide as the message bar's controls.
  round: (theme: Theme) => ({
    width: CONTROL_SIZES.large,
    height: CONTROL_SIZES.large,
    px: 0,
    [`& .${svgIconClasses.root}`]: {
      fontSize: CONTROL_ICON_SIZE,
    },
    // A button with a color of its own keeps its fill.
    ...theme.applyStyles("dark", {
      [`&.${buttonClasses.colorInherit}`]: ringSx(theme),
    }),
    [shortLandscape(theme)]: {
      width: CONTROL_SIZES.medium,
      height: CONTROL_SIZES.medium,
    },
  }),
};

export type BoardControlShape = keyof typeof SHAPE_SX;

interface BoardControlButtonProps extends Omit<
  ButtonProps,
  "size" | "variant"
> {
  shape?: BoardControlShape;
}

export function BoardControlButton({
  color = "inherit",
  disabled = false,
  shape = "pill",
  onClick,
  sx,
  ...props
}: BoardControlButtonProps) {
  return (
    <Button
      {...props}
      {...focusableDisabledProps(disabled, props.className)}
      size="large"
      color={color}
      variant="contained"
      onClick={disabled ? undefined : onClick}
      sx={mergeSx(SHAPE_SX[shape], sx)}
    />
  );
}

// The bar stays light in dark mode: beside it a dark fill clashes and a light
// one outshines the board. A ring still draws the edge eye-gaze users dwell on.
function ringSx(theme: Theme) {
  return {
    border: `1px solid ${theme.vars.palette.outline}`,
    backgroundColor: "transparent",
    [`&, &:hover, &:active, &.${buttonClasses.focusVisible}`]: {
      boxShadow: "none",
    },
    // A tap leaves hover stuck on a touch screen.
    "@media (hover: hover)": {
      "&:hover": { backgroundColor: theme.vars.palette.action.hover },
    },
    // Stays visible when disabled, as dim as its icon; hover must not tint it.
    [`&.${buttonClasses.disabled}`]: {
      borderColor: "currentColor",
      backgroundColor: "transparent",
    },
  };
}
