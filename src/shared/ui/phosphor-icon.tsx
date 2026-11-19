import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";
import type { Icon, IconWeight } from "@phosphor-icons/react/lib";

interface PhosphorIconProps extends Omit<
  SvgIconProps,
  "children" | "component" | "inheritViewBox" | "viewBox"
> {
  icon: Icon;
  weight?: IconWeight;
}

// SvgIcon gives Phosphor's drawing MUI's sizes, colors and class names; the
// test ID follows MUI's icons. Bold matches Material's line weight, which
// regular thins out on the board's controls.
export function PhosphorIcon({
  icon,
  weight = "bold",
  ...props
}: PhosphorIconProps) {
  return (
    <SvgIcon
      {...props}
      component={icon}
      inheritViewBox
      weight={weight}
      data-testid={icon.displayName}
    />
  );
}
