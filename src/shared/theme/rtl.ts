import { useTheme } from "@mui/material/styles";

export const flipForRTL = {
  "&:dir(rtl)": { transform: "scaleX(-1)" },
} as const;

export function useEndSide() {
  const { direction } = useTheme();

  return direction === "rtl" ? "left" : "right";
}
