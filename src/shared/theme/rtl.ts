/** Mirrors directional icons such as Back and Backspace on the X axis in RTL. */
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
