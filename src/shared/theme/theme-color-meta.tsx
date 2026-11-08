import { useColorScheme } from "@mui/material/styles";
import { BACKGROUND_DARK, BACKGROUND_LIGHT } from "./theme-colors";

export function ThemeColorMeta() {
  const { mode, systemMode } = useColorScheme();
  const resolvedMode = mode === "system" ? systemMode : mode;

  return (
    <meta
      name="theme-color"
      content={resolvedMode === "dark" ? BACKGROUND_DARK : BACKGROUND_LIGHT}
    />
  );
}
