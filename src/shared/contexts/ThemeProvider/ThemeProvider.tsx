import CssBaseline from "@mui/material/CssBaseline";
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import type { ReactNode } from "react";

export interface ThemeProviderProps {
  children: ReactNode;
}

const theme = createTheme({
  colorSchemes: {
    dark: true,
  },
});

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <MUIThemeProvider theme={theme} noSsr>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  );
}
