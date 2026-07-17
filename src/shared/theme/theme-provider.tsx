import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
  type ThemeOptions,
} from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import rtlPlugin from "@mui/stylis-plugin-rtl";
import { useLanguage } from "@shared/language/use-language";
import { ThemeColorMeta } from "@shared/theme/theme-color-meta";
import { SHELL_DARK, SHELL_LIGHT } from "@shared/theme/theme-colors";
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

function getThemeOptions(reducedMotion: boolean) {
  return {
    cssVariables: {
      colorSchemeSelector: "class",
      // index.html owns color-scheme; MUI only emits the palette vars.
      disableCssColorScheme: true,
    },
    colorSchemes: {
      light: { palette: { background: { default: SHELL_LIGHT } } },
      dark: { palette: { background: { default: SHELL_DARK } } },
    },
    transitions: reducedMotion
      ? {
        duration: {
          shortest: 0,
          shorter: 0,
          short: 0,
          standard: 0,
          complex: 0,
          enteringScreen: 0,
          leavingScreen: 0,
        },
      }
      : undefined,
    typography: {
      button: {
        textTransform: "none",
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: {
            overscrollBehaviorY: "none",
          },
          body: {
            userSelect: "none",
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: ({ theme }) => {
            const palette = theme.vars?.palette ?? theme.palette;

            return {
              backgroundColor: SHELL_LIGHT,
              color: palette.text.primary,
              backgroundImage: "none",
              ...theme.applyStyles("dark", {
                backgroundColor: SHELL_DARK,
              }),
            };
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => ({
            ...theme.applyStyles("dark", {
              backgroundColor: SHELL_DARK,
              backgroundImage: "none",
            }),
          }),
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 32,
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: 16,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 32,
            paddingTop: 12,
            paddingBottom: 12,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 32,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 32,
          },
        },
      },
    },
  } satisfies ThemeOptions;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { direction } = useLanguage();
  const isRtl = direction === "rtl";
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const theme = createTheme({
    ...getThemeOptions(reducedMotion),
    direction: isRtl ? "rtl" : "ltr",
  });

  return (
    <CacheProvider value={isRtl ? rtlCache : ltrCache}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline />
        <ThemeColorMeta />
        {children}
      </MUIThemeProvider>
    </CacheProvider>
  );
}
