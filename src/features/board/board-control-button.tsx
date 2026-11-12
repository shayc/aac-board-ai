import Button, { type ButtonProps } from "@mui/material/Button";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";

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
      {...focusableDisabledProps(disabled, onClick)}
      size="large"
      color="inherit"
      variant="contained"
      sx={{ width: 72 }}
    />
  );
}
