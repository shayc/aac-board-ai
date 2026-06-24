import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
  type ThemeOptions,
} from "@mui/material/styles";
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

const themeOptions = {
  cssVariables: {
    colorSchemeSelector: "class",
    // index.html owns color-scheme; MUI only emits the palette vars.
    disableCssColorScheme: true,
  },
  colorSchemes: {
    light: { palette: { background: { default: SHELL_LIGHT } } },
    dark: { palette: { background: { default: SHELL_DARK } } },
  },
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
            borderBottom: `1px solid ${palette.divider}`,
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
        paper: ({ ownerState }) => ({
          ...(!ownerState.fullScreen && { borderRadius: 32 }),
        }),
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
          borderRadius: 24,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 24,
        },
      },
    },
  },
} satisfies ThemeOptions;

const ltrTheme = createTheme({ ...themeOptions, direction: "ltr" });
const rtlTheme = createTheme({ ...themeOptions, direction: "rtl" });

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { direction } = useLanguage();
  const isRtl = direction === "rtl";

  return (
    <CacheProvider value={isRtl ? rtlCache : ltrCache}>
      <MUIThemeProvider theme={isRtl ? rtlTheme : ltrTheme}>
        <CssBaseline />
        <ThemeColorMeta />
        {children}
      </MUIThemeProvider>
    </CacheProvider>
  );
}
