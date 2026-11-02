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
import {
  ICON_DARK,
  ICON_LIGHT,
  PRIMARY_DARK,
  PRIMARY_LIGHT,
  SHELL_DARK,
  SHELL_LIGHT,
  SURFACE_DARK,
  SURFACE_LIGHT,
  WARNING_LIGHT,
} from "@shared/theme/theme-colors";
import type { ReactNode } from "react";
import { prefixer } from "stylis";

interface ThemeProviderProps {
  children: ReactNode;
}

const ltrCache = createCache({ key: "muiltr" });
const rtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

const themeOptions = {
  focusVisible: true,
  cssVariables: {
    colorSchemeSelector: "class",
    // index.html owns color-scheme; MUI only emits the palette vars.
    disableCssColorScheme: true,
  },
  colorSchemes: {
    light: {
      palette: {
        primary: PRIMARY_LIGHT,
        warning: WARNING_LIGHT,
        background: { default: SHELL_LIGHT, paper: SURFACE_LIGHT },
        action: { active: ICON_LIGHT },
      },
    },
    dark: {
      palette: {
        primary: PRIMARY_DARK,
        background: { default: SHELL_DARK, paper: SURFACE_DARK },
        action: { active: ICON_DARK },
      },
    },
  },
  motion: {
    reducedMotion: "system",
  },
  typography: {
    fontFamily: "system-ui, sans-serif",
    fontWeightLight: 400,
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
    // Flat surfaces in dark mode too: MUI's elevation overlay would lighten
    // menus past their sticky subheaders, which paint plain paper.
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: ({ theme }) => {
          const palette = (theme.vars ?? theme).palette;

          return {
            backgroundColor: palette.background.default,
            color: palette.text.primary,
            borderBottom: `1px solid ${palette.divider}`,
          };
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: (theme.vars ?? theme).palette.background.default,
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
        root: ({ theme }) => ({
          borderRadius: 32,
          paddingTop: 12,
          paddingBottom: 12,
          variants: [
            {
              props: { variant: "outlined", color: "inherit" },
              style: {
                color: (theme.vars ?? theme).palette.action.active,
                // MUI's rule for colored outlined buttons: 50% of their color.
                borderColor:
                  "color-mix(in srgb, currentColor 50%, transparent)",
              },
            },
          ],
        }),
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

const ltrTheme = createTheme({
  ...themeOptions,
  direction: "ltr",
});

const rtlTheme = createTheme({
  ...themeOptions,
  direction: "rtl",
});

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { direction } = useLanguage();
  const isRtl = direction === "rtl";

  return (
    <CacheProvider value={isRtl ? rtlCache : ltrCache}>
      <MUIThemeProvider theme={isRtl ? rtlTheme : ltrTheme} noSsr>
        <CssBaseline />
        <ThemeColorMeta />
        {children}
      </MUIThemeProvider>
    </CacheProvider>
  );
}
