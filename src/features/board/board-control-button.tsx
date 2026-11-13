import Button, { type ButtonProps } from "@mui/material/Button";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";

type BoardControlButtonProps = Omit<
  ButtonProps,
  "size" | "color" | "variant" | "sx"
>;

export function BoardControlButton({
  className,
  disabled = false,
  onClick,
  ...props
}: BoardControlButtonProps) {
  return (
    <Button
      {...props}
      {...focusableDisabledProps(disabled, className)}
      size="large"
      color="inherit"
      variant="contained"
      onClick={disabled ? undefined : onClick}
      sx={{ width: 72 }}
    />
  );
}
