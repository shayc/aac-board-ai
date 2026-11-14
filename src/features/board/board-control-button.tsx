import Button, { type ButtonProps } from "@mui/material/Button";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";

export const BOARD_CONTROL_WIDTH = 72;

type BoardControlButtonProps = Omit<
  ButtonProps,
  "size" | "color" | "variant" | "sx"
>;

export function BoardControlButton({
  disabled = false,
  onClick,
  ...props
}: BoardControlButtonProps) {
  return (
    <Button
      {...props}
      {...focusableDisabledProps(disabled, props.className)}
      size="large"
      color="inherit"
      variant="contained"
      onClick={disabled ? undefined : onClick}
      sx={{ width: BOARD_CONTROL_WIDTH }}
    />
  );
}
