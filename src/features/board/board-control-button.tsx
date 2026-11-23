import Button, { type ButtonProps } from "@mui/material/Button";
import { svgIconClasses } from "@mui/material/SvgIcon";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { mergeSx } from "@shared/ui/merge-sx";
import { CONTROL_ICON_SIZE, CONTROL_SIZE } from "./board-control-sizes";
import { MIN_CELL_WIDTH_PX } from "./grid/grid-layout";

const ICON_SX = {
  [`& .${svgIconClasses.root}`]: { fontSize: CONTROL_ICON_SIZE },
};

const SHAPE_SX = {
  pill: { width: MIN_CELL_WIDTH_PX, ...ICON_SX },
  round: { width: CONTROL_SIZE, height: CONTROL_SIZE, px: 0, ...ICON_SX },
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
