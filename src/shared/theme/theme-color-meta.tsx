import { useColorScheme } from "@mui/material/styles";
import { SHELL_DARK, SHELL_LIGHT } from "@shared/theme/theme-colors";

export function ThemeColorMeta() {
  const { mode, systemMode } = useColorScheme();
  const resolvedMode = mode === "system" ? systemMode : mode;

  return (
    <meta
      name="theme-color"
      content={resolvedMode === "dark" ? SHELL_DARK : SHELL_LIGHT}
    />
  );
}
