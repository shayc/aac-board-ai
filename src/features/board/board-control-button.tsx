import Button, { type ButtonProps } from "@mui/material/Button";
import type { Theme } from "@mui/material/styles";
import { svgIconClasses } from "@mui/material/SvgIcon";
import { shortLandscape } from "@shared/theme/short-landscape";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { mergeSx } from "@shared/ui/merge-sx";
import {
  MESSAGE_ACTION_SIZE,
  MESSAGE_SECONDARY_ACTION_ICON_SIZE,
  MESSAGE_SECONDARY_ACTION_SIZE,
} from "./message/message-bar";

const SHAPE_SX = {
  // As wide as the grid's narrowest tile. Three of them and the gaps between
  // them fill the narrowest phone, 320px wide.
  pill: { width: 88 },
  // As large as the message bar's play, the row's other end. It holds one
  // icon, so the button's side padding gives way to the fixed width. A short
  // landscape bar drops a step, and the buttons follow it.
  round: (theme: Theme) => ({
    width: MESSAGE_ACTION_SIZE,
    height: MESSAGE_ACTION_SIZE,
    px: 0,
    [`& .${svgIconClasses.root}`]: {
      fontSize: MESSAGE_SECONDARY_ACTION_ICON_SIZE,
    },
    [shortLandscape(theme)]: {
      width: MESSAGE_SECONDARY_ACTION_SIZE,
      height: MESSAGE_SECONDARY_ACTION_SIZE,
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
