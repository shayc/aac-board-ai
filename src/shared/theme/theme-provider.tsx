import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { buttonClasses } from "@mui/material/Button";
import { chipClasses } from "@mui/material/Chip";
import CssBaseline from "@mui/material/CssBaseline";
import { outlinedInputClasses } from "@mui/material/OutlinedInput";
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

declare module "@mui/material/styles" {
  interface Shape {
    borderRadiusSm: string;
    borderRadiusLg: string;
    borderRadiusFull: string;
  }

  interface ShapeOptions {
    borderRadiusSm?: string;
    borderRadiusLg?: string;
    borderRadiusFull?: string;
  }
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ltrCache = createCache({ key: "muiltr" });
const rtlCache = createCache({
  key: "muirtl",
  stylisPlugins: [prefixer, rtlPlugin],
});

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

const shadows = [
  "none",
  ...Array.from({ length: 24 }, (_, index) => softShadow(index + 1)),
] as Shadows;

function softShadow(elevation: number) {
  const keyOffset = Math.round(elevation / 2);
  const ambientAlpha = (0.07 + elevation * 0.003).toFixed(3);

  return `0 ${keyOffset}px ${elevation + 1}px rgb(16 24 40 / 0.08), 0 ${elevation + 1}px ${3 * elevation + 3}px rgb(16 24 40 / ${ambientAlpha})`;
}

// Theme overrides follow MUI's state rules, so the sticky touch hover would
// otherwise repaint the focused, error, and disabled outlines.
const idleTouchHoverOutline = `&:hover:not(.${outlinedInputClasses.focused}, .${outlinedInputClasses.error}, .${outlinedInputClasses.disabled}) .${outlinedInputClasses.notchedOutline}`;

const themeOptions = {
  focusVisible: true,
  shadows,
  // Strings so radii returned from sx callbacks pass through as lengths; a
  // number would be multiplied by the base again. MUI's Paper-based surfaces
  // (menus, popovers, alerts, snackbars) and tooltips inherit the base.
  shape: {
    borderRadius: "16px",
    borderRadiusSm: "12px",
    borderRadiusLg: "32px",
    borderRadiusFull: "9999px",
  },
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
        Button: {
          inheritContainedBg: "#ffffff",
          inheritContainedHoverBg: grey[100],
        },
        Chip: { defaultBorder: "rgba(0, 0, 0, 0.5)" },
        action: { active: "rgba(0, 0, 0, 0.6)" },
      },
    },
    dark: {
      palette: {
        grey,
        background: { default: SHELL_DARK, paper: "#1a1d23" },
        error: { main: "#f2b8b5" },
        Chip: { defaultBorder: "rgba(255, 255, 255, 0.42)" },
        action: { active: "rgba(255, 255, 255, 0.7)" },
      },
    },
  },
  motion: {
    reducedMotion: "system",
  },
  typography: {
    fontFamily: "system-ui, sans-serif",
    fontWeightLight: 400,
    fontWeightBold: 600,
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
        color: "transparent",
        elevation: 0,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          borderBottom: `1px solid ${(theme.vars ?? theme).palette.divider}`,
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => {
          const radius = (theme.vars ?? theme).shape.borderRadius;

          return {
            backgroundColor: (theme.vars ?? theme).palette.background.default,
            backgroundImage: "none",
            // Physical corners, like the drawer's own `left`/`right` offset, are
            // mirrored by the RTL stylis plugin, so the inner edge stays rounded.
            variants: [
              {
                props: { anchor: "left" },
                style: {
                  borderTopRightRadius: radius,
                  borderBottomRightRadius: radius,
                },
              },
              {
                props: { anchor: "right" },
                style: {
                  borderTopLeftRadius: radius,
                  borderBottomLeftRadius: radius,
                },
              },
            ],
          };
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: (theme.vars ?? theme).shape.borderRadiusLg,
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
        root: ({ theme }) => ({
          borderRadius: (theme.vars ?? theme).shape.borderRadiusFull,
          paddingTop: 12,
          paddingBottom: 12,
          variants: [
            {
              props: { variant: "contained", color: "inherit" },
              style: theme.applyStyles("light", {
                [`&.${buttonClasses.disabled}`]: {
                  backgroundColor: "transparent",
                },
              }),
            },
          ],
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: (theme.vars ?? theme).shape.borderRadiusFull,
          "@media (hover: none)": {
            [idleTouchHoverOutline]: {
              borderColor: (theme.vars ?? theme).palette.Chip.defaultBorder,
            },
          },
          variants: [
            {
              props: { multiline: true },
              style: { borderRadius: (theme.vars ?? theme).shape.borderRadius },
            },
          ],
        }),
        notchedOutline: ({ theme }) => ({
          borderColor: (theme.vars ?? theme).palette.Chip.defaultBorder,
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        clickable: ({ theme }) => ({
          ...theme.typography.body1,
          height: 48,
          borderRadius: (theme.vars ?? theme).shape.borderRadiusFull,
          [`& .${chipClasses.label}`]: {
            paddingLeft: 15,
            paddingRight: 15,
          },
          [`& .${chipClasses.icon}`]: {
            marginLeft: 12,
          },
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: (theme.vars ?? theme).shape.borderRadiusFull,
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          marginInline: 4,
          borderRadius: (theme.vars ?? theme).shape.borderRadiusSm,
        }),
      },
    },
    MuiAutocomplete: {
      defaultProps: {
        slotProps: {
          popper: {
            modifiers: [{ name: "offset", options: { offset: [0, 4] } }],
          },
        },
      },
      styleOverrides: {
        option: ({ theme }) => ({
          marginInline: 4,
          borderRadius: (theme.vars ?? theme).shape.borderRadiusSm,
        }),
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
