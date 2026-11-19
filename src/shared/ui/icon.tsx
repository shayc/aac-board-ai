import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType, SVGProps } from "react";

export type IconSvg = ComponentType<SVGProps<SVGSVGElement>>;

interface IconProps extends Omit<
  SvgIconProps,
  "children" | "component" | "inheritViewBox" | "viewBox"
> {
  svg: IconSvg;
}

// Icons are Material Symbols Rounded at weight 600, imported one file each as
// `@material-symbols/svg-600/rounded/<name>.svg?react`; lighter weights thin
// out on the board's controls, and `-fill` files draw solid shapes such as play.
export function Icon({ svg, ...props }: IconProps) {
  return <SvgIcon {...props} component={svg} inheritViewBox />;
}
