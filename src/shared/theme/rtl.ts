import { useLanguage } from "@shared/language/use-language";

export const flipForRTL = {
  "&:dir(rtl)": { transform: "scaleX(-1)" },
} as const;

/**
 * Mirrors on the X axis in LTR when the source artwork already has its RTL
 * orientation, such as `ViewSidebarOutlined` and its right-hand rail.
 */
export const flipForLTR = {
  "&:dir(ltr)": { transform: "scaleX(-1)" },
} as const;

export function useEndSide() {
  const { direction } = useLanguage();

  return direction === "rtl" ? "left" : "right";
}
