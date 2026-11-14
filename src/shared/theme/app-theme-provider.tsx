import CssBaseline from "@mui/material/CssBaseline";
import { useUIDirection } from "@shared/language/language-store";
import type { ReactNode } from "react";
import { DirectionalThemeProvider } from "./directional-theme-provider";
import { ThemeColorMeta } from "./theme-color-meta";

interface AppThemeProviderProps {
  children: ReactNode;
}

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const uiDirection = useUIDirection();

  return (
    <DirectionalThemeProvider direction={uiDirection}>
      <CssBaseline />
      <ThemeColorMeta />
      {children}
    </DirectionalThemeProvider>
  );
}
