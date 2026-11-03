import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { buttonClasses } from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
  type Shadows,
  type ThemeOptions,
} from "@mui/material/styles";
import rtlPlugin from "@mui/stylis-plugin-rtl";
import { useLanguage } from "@shared/language/use-language";
import { ThemeColorMeta } from "@shared/theme/theme-color-meta";
import { SHELL_DARK, SHELL_LIGHT } from "@shared/theme/theme-colors";
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

// MUI's grey lightness steps, tinted to the shell's cool hue so default
// buttons, chips, and tooltips match the surfaces instead of reading as
// neutral grey.
const grey = {
  50: "#f8faff",
  100: "#f3f5fa",
  200: "#eceef3",
  300: "#dde0e6",
  400: "#babdc3",
  500: "#9b9ea4",
  600: "#72757b",
  700: "#5e6167",
  800: "#3f4248",
  900: "#1e2127",
  A100: "#f3f5fa",
  A200: "#eceef3",
  A400: "#babdc3",
  A700: "#5e6167",
};

// One soft, cool-tinted recipe at every elevation, so tiles, buttons, and
// chrome all lift the same way instead of mixing in MUI's black shadows.
const shadows = [
  "none",
  ...Array.from({ length: 24 }, (_, index) => softShadow(index + 1)),
] as Shadows;

function softShadow(elevation: number) {
  const keyOffset = Math.round(elevation / 2);
  const ambientAlpha = (0.07 + elevation * 0.003).toFixed(3);

  return `0 ${keyOffset}px ${elevation + 1}px rgb(16 24 40 / 0.08), 0 ${elevation + 1}px ${3 * elevation + 3}px rgb(16 24 40 / ${ambientAlpha})`;
}

const themeOptions = {
  focusVisible: true,
  shadows,
  cssVariables: {
    colorSchemeSelector: "class",
    // index.html owns color-scheme; MUI only emits the palette vars.
    disableCssColorScheme: true,
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#0967d4" },
        grey,
        background: { default: SHELL_LIGHT, paper: "#ffffff" },
        // Grey on the tinted page has no edge; white reads as raised, like
        // the message bar.
        Button: {
          inheritContainedBg: "#ffffff",
          inheritContainedHoverBg: grey[100],
        },
      },
    },
    dark: {
      palette: {
        grey,
        background: { default: SHELL_DARK, paper: "#1a1d23" },
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
            backgroundImage: "none",
          };
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: (theme.vars ?? theme).palette.background.default,
          backgroundImage: "none",
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
          variants: [
            {
              props: { variant: "contained", color: "inherit" },
              // A filled disabled button looks more solid than the white
              // enabled ones, so drop the fill and let the faded icon carry
              // the state.
              style: ({ theme }) =>
                theme.applyStyles("light", {
                  [`&.${buttonClasses.disabled}`]: {
                    backgroundColor: "transparent",
                  },
                }),
            },
          ],
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
