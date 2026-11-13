import { useTheme } from "@mui/material/styles";

export const flipForRTL = {
  "&:dir(rtl)": { transform: "scaleX(-1)" },
} as const;

// For source artwork that already faces RTL, such as ViewSidebarOutlined.
export const flipForLTR = {
  "&:dir(ltr)": { transform: "scaleX(-1)" },
} as const;

export function useEndSide() {
  const { direction } = useTheme();

  return direction === "rtl" ? "left" : "right";
}
