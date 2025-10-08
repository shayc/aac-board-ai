import { getContrastRatio } from "@mui/material/styles";

export function getReadableTextColor(background: string) {
  const white = "#fff";
  const black = "#000";

  const whiteRatio = getContrastRatio(white, background);
  const blackRatio = getContrastRatio(black, background);

  const color = whiteRatio >= blackRatio ? white : black;

  return color;
}
