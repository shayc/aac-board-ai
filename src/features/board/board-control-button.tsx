import Button, { type ButtonProps } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
import { svgIconClasses } from "@mui/material/SvgIcon";
import { shortLandscape } from "@shared/theme/short-landscape";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { mergeSx } from "@shared/ui/merge-sx";
import { CONTROL_ICON_SIZE, CONTROL_SIZES } from "./board-control-sizes";
import { MIN_CELL_WIDTH_PX } from "./grid/grid-layout";

const ICON_SX = {
  [`& .${svgIconClasses.root}`]: { fontSize: CONTROL_ICON_SIZE },
};

const SHAPE_SX = {
  // As wide as the grid's narrowest tile.
  pill: { width: MIN_CELL_WIDTH_PX, ...ICON_SX },
  // It holds one icon, so the button's side padding gives way to the fixed
  // width, which matches the message bar's controls at the row's other end.
  round: (theme: Theme) => ({
    width: CONTROL_SIZES.large,
    height: CONTROL_SIZES.large,
    px: 0,
    ...ICON_SX,
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
