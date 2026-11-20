import { autocompleteClasses } from "@mui/material/Autocomplete";
import { buttonClasses } from "@mui/material/Button";
import { chipClasses } from "@mui/material/Chip";
import { red } from "@mui/material/colors";
import { outlinedInputClasses } from "@mui/material/OutlinedInput";
import {
  createTheme,
  type Shadows,
  type ThemeOptions,
} from "@mui/material/styles";
import { toggleButtonClasses } from "@mui/material/ToggleButton";
import {
  buttonFeedbackTiming,
  buttonFeedbackTransition,
  instantFeedbackOnTouch,
} from "./button-feedback";
import { safeAreaInset } from "./safe-area";
import { BACKGROUND_DARK, BACKGROUND_LIGHT } from "./theme-colors";

declare module "@mui/material/styles" {
  interface CssThemeVariables {
    enabled: true;
  }

  interface Palette {
    outline: string;
  }

  interface PaletteOptions {
    outline?: string;
  }

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

const OUTLINE = {
  light: "rgba(0, 0, 0, 0.5)",
  dark: "rgba(255, 255, 255, 0.42)",
};

const shadows = [
  "none",
  ...Array.from({ length: 24 }, (_, index) => softShadow(index + 1)),
] as Shadows;

function softShadow(elevation: number) {
  const ring = "0 0 0 1px rgb(16 24 40 / 0.05)";
  const key = `0 ${Math.ceil(elevation / 2)}px ${elevation + 1}px rgb(16 24 40 / 0.06)`;
  const ambientAlpha = (0.1 + elevation * 0.003).toFixed(3);
  const ambient = `0 ${2 * elevation}px ${4 * elevation}px -${1.5 * elevation}px rgb(16 24 40 / ${ambientAlpha})`;

  return `${ring}, ${key}, ${ambient}`;
}

// Sticky touch hover must preserve focused, error, and disabled outlines.
const IDLE_TOUCH_HOVER_OUTLINE = `&:hover:not(.${outlinedInputClasses.focused}, .${outlinedInputClasses.error}, .${outlinedInputClasses.disabled}) .${outlinedInputClasses.notchedOutline}`;

// The theme selects a scheme by class (`colorSchemeSelector` below), and MUI
// names each class after its scheme. An element with this class gives itself
// and its subtree the light scheme's `theme.vars`, whatever the theme mode.
// `applyStyles("dark")` still applies there in dark mode: it matches the class
// on the root.
export const LIGHT_SCHEME_CLASS = "light";

const themeOptions = {
  focusVisible: true,
  shadows,
  // Explicit lengths prevent sx from multiplying these radii by the base radius.
  shape: {
    borderRadius: "20px",
    borderRadiusSm: "12px",
    borderRadiusLg: "32px",
    borderRadiusFull: "9999px",
  },
  cssVariables: {
    colorSchemeSelector: "class",
    // index.html owns color-scheme.
    disableCssColorScheme: true,
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: "#14657e" },
        // MUI's default info blue would be the only blue in the app.
        info: { main: "#14657e" },
        grey,
        background: { default: BACKGROUND_LIGHT, paper: "#ffffff" },
        Button: {
          inheritContainedBg: "#ffffff",
          inheritContainedHoverBg: grey[100],
        },
        outline: OUTLINE.light,
        Chip: { defaultBorder: OUTLINE.light },
        SnackbarContent: { bg: grey[900], color: grey[50] },
        action: { active: "rgba(0, 0, 0, 0.6)" },
      },
    },
    dark: {
      palette: {
        primary: { main: "#72c4de" },
        info: { main: "#72c4de" },
        grey,
        background: { default: BACKGROUND_DARK, paper: "#262930" },
        error: { main: red.A100 },
        outline: OUTLINE.dark,
        Chip: { defaultBorder: OUTLINE.dark },
        SnackbarContent: { bg: grey[100], color: grey[900] },
        action: {
          active: "rgba(255, 255, 255, 0.7)",
          // MUI's 30% white reads as enabled on dark surfaces. 20% matches the
          // light scheme's disabled contrast.
          disabled: "rgba(255, 255, 255, 0.2)",
        },
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
    h6: {
      fontWeight: 600,
    },
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
    MuiPaper: {
      styleOverrides: {
        root: {
          // MUI's dark elevation overlay would add surface steps beyond
          // background.default and background.paper.
          backgroundImage: "none",
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        color: "transparent",
        elevation: 0,
      },
    },
    MuiToolbar: {
      styleOverrides: {
        gutters: ({ theme }) => ({
          paddingLeft: theme.spacing(3),
          paddingRight: theme.spacing(3),
        }),
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => {
          const radius = theme.vars.shape.borderRadius;

          return {
            backgroundColor: theme.vars.palette.background.default,
            // The RTL stylis plugin mirrors these corners with the drawer anchor.
            variants: [
              {
                props: { anchor: "left" },
                style: {
                  borderTopRightRadius: radius,
                  borderBottomRightRadius: radius,
                  paddingLeft: safeAreaInset("left"),
                },
              },
              {
                props: { anchor: "right" },
                style: {
                  borderTopLeftRadius: radius,
                  borderBottomLeftRadius: radius,
                  paddingRight: safeAreaInset("right"),
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
          variants: [
            {
              props: { fullScreen: false },
              style: {
                borderRadius: theme.vars.shape.borderRadiusLg,
              },
            },
            {
              props: { fullScreen: true },
              style: {
                paddingTop: safeAreaInset("top"),
                paddingRight: safeAreaInset("right"),
                paddingBottom: safeAreaInset("bottom"),
                paddingLeft: safeAreaInset("left"),
              },
            },
          ],
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
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          "&::before": {
            content: '""',
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            backgroundColor: "currentColor",
            opacity: 0,
            pointerEvents: "none",
            transition: buttonFeedbackTransition(theme, ["opacity"]),
            "@media (prefers-reduced-motion: reduce)": {
              transition: "none",
            },
            ...instantFeedbackOnTouch,
          },
          "&:active::before": {
            opacity: theme.vars.palette.action.activatedOpacity,
            transitionDuration: "0ms",
          },
        }),
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.vars.shape.borderRadiusFull,
          paddingTop: 12,
          paddingBottom: 12,
          ...buttonFeedbackTiming(theme),
          variants: [
            {
              props: { variant: "contained", color: "inherit" },
              // MUI's grey disabled fill is darker than the light page and
              // would outweigh the enabled buttons beside it.
              style: theme.applyStyles("light", {
                [`&.${buttonClasses.disabled}`]: {
                  backgroundColor: theme.vars.palette.Button.inheritContainedBg,
                },
              }),
            },
          ],
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          ...buttonFeedbackTiming(theme),
          variants: [
            {
              props: { color: "default" },
              // The icon's dimmer color would press fainter than a text
              // button beside it, as in the header.
              style: {
                "&::before": {
                  backgroundColor: theme.vars.palette.text.primary,
                },
              },
            },
          ],
        }),
      },
    },
    MuiFab: {
      styleOverrides: {
        root: ({ theme }) => buttonFeedbackTiming(theme),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.vars.shape.borderRadiusFull,
          "@media (hover: none)": {
            [IDLE_TOUCH_HOVER_OUTLINE]: {
              borderColor: theme.vars.palette.outline,
            },
          },
          variants: [
            {
              props: { multiline: true },
              style: { borderRadius: theme.vars.shape.borderRadius },
            },
          ],
        }),
        notchedOutline: ({ theme }) => ({
          borderColor: theme.vars.palette.outline,
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        clickable: ({ theme }) => ({
          // Beside large buttons, so chips share their height and label type.
          ...theme.typography.button,
          height: 48,
          borderRadius: theme.vars.shape.borderRadiusFull,
          fontSize: theme.typography.pxToRem(15),
          ...buttonFeedbackTiming(theme),
          [`& .${chipClasses.label}`]: {
            paddingLeft: 20,
            paddingRight: 20,
          },
          [`& .${chipClasses.icon}`]: {
            marginLeft: 12,
          },
          variants: [
            {
              props: { variant: "outlined" },
              // The 1px outline keeps the label where filled chips place it.
              style: {
                [`& .${chipClasses.label}`]: {
                  paddingLeft: 19,
                  paddingRight: 19,
                },
              },
            },
            {
              props: { variant: "filled", color: "default" },
              // A quieter fill keeps chips distinct from navigation buttons.
              style: {
                backgroundColor: theme.alpha(theme.palette.common.black, 0.06),
                [`&:hover, &.${chipClasses.focusVisible}`]: {
                  backgroundColor: theme.alpha(theme.palette.common.black, 0.1),
                },
                ...theme.applyStyles("dark", {
                  backgroundColor: theme.alpha(
                    theme.palette.common.white,
                    0.08,
                  ),
                  [`&:hover, &.${chipClasses.focusVisible}`]: {
                    backgroundColor: theme.alpha(
                      theme.palette.common.white,
                      0.12,
                    ),
                  },
                }),
              },
            },
          ],
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.vars.shape.borderRadiusFull,
          ...buttonFeedbackTiming(theme),
        }),
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: ({ theme }) => ({
          marginInline: 4,
          borderRadius: theme.vars.shape.borderRadiusSm,
          // MUI drops the 48px touch row from the sm breakpoint up, so tablets
          // would get desktop rows. The Autocomplete option below matches.
          "@media (pointer: coarse)": { minHeight: 48 },
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
        // Styles options from the listbox, where MUI styles them, so that
        // these rules come after MUI's.
        listbox: ({ theme }) => ({
          [`& .${autocompleteClasses.option}`]: {
            marginInline: 4,
            borderRadius: theme.vars.shape.borderRadiusSm,
            "@media (pointer: coarse)": { minHeight: 48 },
            // Enter picks the highlighted option, so it shows on every device.
            [`&.${autocompleteClasses.focused}`]: {
              backgroundColor: theme.vars.palette.action.selected,
            },
            // The keyboard ring alone marks the option, as in lists and menus.
            [`&.${autocompleteClasses.focusVisible}`]: {
              backgroundColor: "transparent",
            },
            // Stays tinted on touch screens too, where MUI turns it grey.
            [`&[aria-selected="true"].${autocompleteClasses.focused}`]: {
              backgroundColor: theme.alpha(
                theme.vars.palette.primary.main,
                `${theme.vars.palette.action.selectedOpacity} + ${theme.vars.palette.action.hoverOpacity}`,
              ),
            },
          },
        }),
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          variants: [
            {
              props: { orientation: "horizontal" },
              style: {
                padding: "12px 0",
                "@media (pointer: coarse)": { padding: "12px 0" },
              },
            },
          ],
        },
        mark: {
          width: 2,
          height: 12,
          borderRadius: 1,
        },
        markActive: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.default,
        }),
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => {
          // MUI's 8% tint is 1.1:1 against the drawer, too faint to see.
          const selectedBackground = `color-mix(in srgb, ${theme.vars.palette.primary.main} 20%, transparent)`;

          return {
            borderColor: theme.vars.palette.outline,
            [`&.${toggleButtonClasses.selected}`]: {
              // Primary-colored text on the stronger tint falls under 4.5:1.
              color: theme.vars.palette.text.primary,
              backgroundColor: selectedBackground,
              "&:hover": {
                backgroundColor: `color-mix(in srgb, ${theme.vars.palette.primary.main} 28%, transparent)`,
                // Touch keeps :hover after a tap.
                "@media (hover: none)": {
                  backgroundColor: selectedBackground,
                },
              },
            },
          };
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        enterDelay: 500,
      },
      styleOverrides: {
        tooltip: ({ theme }) => ({
          fontSize: theme.typography.pxToRem(13),
        }),
      },
    },
  },
} satisfies ThemeOptions;

export const ltrTheme = createTheme({
  ...themeOptions,
  direction: "ltr",
});

export const rtlTheme = createTheme({
  ...themeOptions,
  direction: "rtl",
});
