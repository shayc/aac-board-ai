import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType, SVGProps } from "react";

export type IconSvg = ComponentType<SVGProps<SVGSVGElement>>;

// An SVG component draws its own children, so SvgIcon's titleAccess would be
// dropped; name the control instead.
interface IconProps extends Omit<
  SvgIconProps,
  "children" | "component" | "inheritViewBox" | "titleAccess" | "viewBox"
> {
  svg: IconSvg;
}

// Icons are Material Symbols Rounded, one file each from
// `@material-symbols/svg-600/rounded/<name>.svg?react`. The package draws at
// the 48px optical size, so weight 600 keeps lines as heavy as Material's at
// 20–36px; `-fill` files draw solid shapes such as play.
export function Icon({ svg, ...props }: IconProps) {
  return <SvgIcon {...props} component={svg} inheritViewBox />;
}
