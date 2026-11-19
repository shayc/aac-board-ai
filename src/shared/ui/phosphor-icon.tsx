import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType, SVGProps } from "react";

export type PhosphorSvg = ComponentType<SVGProps<SVGSVGElement>>;

interface PhosphorIconProps extends Omit<
  SvgIconProps,
  "children" | "component" | "inheritViewBox" | "viewBox"
> {
  icon: PhosphorSvg;
}

// Import one weight per icon, as `@phosphor-icons/core/bold/*.svg?react`; the
// React package ships all six. Bold matches Material's line weight on the
// board's controls, and fill draws solid shapes such as play.
export function PhosphorIcon({ icon, ...props }: PhosphorIconProps) {
  return <SvgIcon {...props} component={icon} inheritViewBox />;
}
