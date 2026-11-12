import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import rtlPlugin from "@mui/stylis-plugin-rtl";
import { useLanguage } from "@shared/language/use-language";
import type { ReactNode } from "react";
import { prefixer } from "stylis";
import { ltrTheme, rtlTheme } from "./theme";
import { ThemeColorMeta } from "./theme-color-meta";

const ltrCache = createCache({ key: "muiltr" });
const rtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { direction } = useLanguage();
  const isRTL = direction === "rtl";

  return (
    <CacheProvider value={isRTL ? rtlCache : ltrCache}>
      <MUIThemeProvider theme={isRTL ? rtlTheme : ltrTheme} noSsr>
        <CssBaseline />
        <ThemeColorMeta />
        {children}
      </MUIThemeProvider>
    </CacheProvider>
  );
}
