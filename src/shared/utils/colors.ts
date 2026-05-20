import { getContrastRatio } from "@mui/material/styles";

export function getReadableTextColor(background: string): string {
  const lightText = "#fff";
  const darkText = "#000";

  const lightRatio = getContrastRatio(lightText, background);
  const darkRatio = getContrastRatio(darkText, background);

  return lightRatio >= darkRatio ? lightText : darkText;
}
