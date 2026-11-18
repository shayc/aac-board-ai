import Button, { buttonClasses, type ButtonProps } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
import { svgIconClasses } from "@mui/material/SvgIcon";
import { shortLandscape } from "@shared/theme/short-landscape";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { mergeSx } from "@shared/ui/merge-sx";
import { CONTROL_ICON_SIZE, CONTROL_SIZES } from "./board-control-sizes";

const SHAPE_SX = {
  // As wide as the grid's narrowest tile. Three of them and the gaps between
  // them fill the narrowest phone, 320px wide.
  pill: { width: 88 },
  // It holds one icon, so the button's side padding gives way to the fixed
  // width, which matches the message bar's controls at the row's other end.
  round: (theme: Theme) => ({
    width: CONTROL_SIZES.large,
    height: CONTROL_SIZES.large,
    px: 0,
    [`& .${svgIconClasses.root}`]: {
      fontSize: CONTROL_ICON_SIZE,
    },
    ...theme.applyStyles("dark", ringSx(theme)),
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

// The message bar stays light in dark mode, so beside it a dark fill clashes
// and a light one outshines the board. A ring leaves the bar as the row's only
// surface and still draws the button's edge, which someone dwelling on it with
// eye gaze rests on.
function ringSx(theme: Theme) {
  return {
    "--variant-containedBg": "transparent",
    border: `1px solid ${theme.vars.palette.outline}`,
    [`&, &:hover, &:active, &.${buttonClasses.focusVisible}`]: {
      boxShadow: "none",
    },
    // A tap leaves hover stuck on a touch screen.
    "@media (hover: hover)": {
      "&:hover": {
        "--variant-containedBg": theme.vars.palette.action.hover,
      },
    },
    [`&.${buttonClasses.disabled}`]: {
      borderColor: theme.vars.palette.action.disabledBackground,
      backgroundColor: "transparent",
    },
  };
}
