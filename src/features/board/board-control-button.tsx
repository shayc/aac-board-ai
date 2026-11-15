import Button, { type ButtonProps } from "@mui/material/Button";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";
import { mergeSx } from "@shared/ui/merge-sx";

type BoardControlButtonProps = Omit<ButtonProps, "size" | "variant">;

export function BoardControlButton({
  color = "inherit",
  disabled = false,
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
      sx={mergeSx({ width: 72 }, sx)}
    />
  );
}
