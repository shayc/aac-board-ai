import CssBaseline from "@mui/material/CssBaseline";
import { useUIDirection } from "@shared/language/language-store";
import type { ReactNode } from "react";
import { DirectionProvider } from "./direction-provider";
import { ThemeColorMeta } from "./theme-color-meta";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const uiDirection = useUIDirection();

  return (
    <DirectionProvider direction={uiDirection}>
      <CssBaseline />
      <ThemeColorMeta />
      {children}
    </DirectionProvider>
  );
}
