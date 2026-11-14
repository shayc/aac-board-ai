import Button, { type ButtonProps } from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";
import { focusableDisabledProps } from "@shared/ui/focusable-disabled";

type BoardControlButtonProps = Omit<ButtonProps, "size" | "variant" | "sx"> & {
  sx?: Exclude<SxProps<Theme>, readonly unknown[]>;
};

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
      sx={[{ width: 72 }, sx ?? false]}
    />
  );
}
