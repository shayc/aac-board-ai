import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { ThemeProvider as MUIThemeProvider } from "@mui/material/styles";
import rtlPlugin from "@mui/stylis-plugin-rtl";
import type { ReactNode } from "react";
import { prefixer } from "stylis";
import { ltrTheme, rtlTheme } from "./theme";

const ltrCache = createCache({ key: "muiltr" });
const rtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

interface DirectionProviderProps {
  direction: "ltr" | "rtl";
  children: ReactNode;
}

/** Styles its subtree for a direction; the caller sets the matching `dir`. */
export function DirectionProvider({
  direction,
  children,
}: DirectionProviderProps) {
  const isRTL = direction === "rtl";

  return (
    <CacheProvider value={isRTL ? rtlCache : ltrCache}>
      <MUIThemeProvider theme={isRTL ? rtlTheme : ltrTheme} noSsr>
        {children}
      </MUIThemeProvider>
    </CacheProvider>
  );
}
