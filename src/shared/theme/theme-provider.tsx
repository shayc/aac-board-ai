import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import rtlPlugin from "@mui/stylis-plugin-rtl";
import { useLanguage } from "@shared/language/use-language";
import type { ReactNode } from "react";
import { prefixer } from "stylis";

export interface ThemeProviderProps {
  children: ReactNode;
}

const ltrCache = createCache({ key: "muiltr" });
const rtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { direction } = useLanguage();

  const theme = createTheme({
    direction,
    colorSchemes: {
      dark: true,
    },
    typography: {
      button: {
        textTransform: "none",
      },
    },
  });

  return (
    <CacheProvider value={direction === "rtl" ? rtlCache : ltrCache}>
      <MUIThemeProvider theme={theme} noSsr>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </CacheProvider>
  );
}
