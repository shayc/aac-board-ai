import Button, { type ButtonProps } from "@mui/material/Button";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { mergeSx } from "@shared/ui/merge-sx";
import { MESSAGE_SECONDARY_ACTION_SIZE } from "./message/message-bar";

// As large as the message bar's backspace, which it sits beside. It holds one
// icon, so the button's side padding gives way to the fixed width.
const ROUND_SX = {
  width: MESSAGE_SECONDARY_ACTION_SIZE,
  height: MESSAGE_SECONDARY_ACTION_SIZE,
  px: 0,
} as const;

/** A pill takes the width its row gives it; a round button has a fixed size. */
export type BoardControlShape = "pill" | "round";

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
      sx={mergeSx(shape === "round" && ROUND_SX, sx)}
    />
  );
}
