import { getContrastRatio } from "@mui/material/styles";

export function getReadableTextColor(background: string): string {
  const lightText = "#fff";
  const darkText = "#000";

  const whiteRatio = getContrastRatio(lightText, background);
  const blackRatio = getContrastRatio(darkText, background);

  return whiteRatio >= blackRatio ? lightText : darkText;
}
