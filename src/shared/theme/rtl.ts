import { useTheme } from "@mui/material/styles";

export const flipForRTL = {
  "&:dir(rtl)": { transform: "scaleX(-1)" },
} as const;

export const flipForLTR = {
  "&:dir(ltr)": { transform: "scaleX(-1)" },
} as const;

export function useEndSide() {
  const { direction } = useTheme();

  return direction === "rtl" ? "left" : "right";
}

export function useStartSide() {
  const { direction } = useTheme();

  return direction === "rtl" ? "right" : "left";
}
