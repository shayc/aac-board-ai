import CssBaseline from "@mui/material/CssBaseline";
import { useUIDirection } from "@shared/language/language-store";
import type { ReactNode } from "react";
import { DirectionalThemeProvider } from "./directional-theme-provider";
import { ThemeColorMeta } from "./theme-color-meta";

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
