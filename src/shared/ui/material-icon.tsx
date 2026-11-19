import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon";
import type { ComponentType, SVGProps } from "react";

export type IconSVG = ComponentType<SVGProps<SVGSVGElement>>;

// An SVG component draws its own children, so SvgIcon's titleAccess would be
// dropped; name the control instead.
interface MaterialIconProps extends Omit<
  SvgIconProps,
  "children" | "component" | "inheritViewBox" | "titleAccess" | "viewBox"
> {
  svg: IconSVG;
}

// Icons are Material Symbols Rounded, one file each from
// `@material-symbols/svg-600/rounded/<name>.svg?react`. The package draws at
// the 48px optical size, which reads thin at the app's smaller sizes, hence
// weight 600; `-fill` files draw solid shapes such as play.
export function MaterialIcon({ svg, ...props }: MaterialIconProps) {
  return <SvgIcon {...props} component={svg} inheritViewBox />;
}
