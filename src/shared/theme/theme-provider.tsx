import CssBaseline from "@mui/material/CssBaseline";
import { useColorScheme } from "@mui/material/styles";
import { useUIDirection } from "@shared/language/language-store";
import type { ReactNode } from "react";
import { DirectionalThemeProvider } from "./directional-theme-provider";
import { BACKGROUND_DARK, BACKGROUND_LIGHT } from "./theme-colors";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const uiDirection = useUIDirection();

  return (
    <DirectionalThemeProvider direction={uiDirection}>
      <CssBaseline />
      <ThemeColorMeta />
      {children}
    </DirectionalThemeProvider>
  );
}

function ThemeColorMeta() {
  const { mode, systemMode } = useColorScheme();
  const resolvedMode = mode === "system" ? systemMode : mode;

  return (
    <meta
      name="theme-color"
      content={resolvedMode === "dark" ? BACKGROUND_DARK : BACKGROUND_LIGHT}
    />
  );
}
