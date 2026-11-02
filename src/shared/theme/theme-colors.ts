// SHELL paints the bars and chrome; CONTENT is the reading surface.
export const SHELL_LIGHT = "#eef1f6";
export const SHELL_DARK = "#0e1014";

export const CONTENT_LIGHT = "#eef1f6";
export const CONTENT_DARK = "#0e1014";

export const SURFACE_LIGHT = "#ffffff";
export const SURFACE_DARK = "#1a1d23";

// MUI's default action.active is 54% black in light but solid white in dark.
export const ICON_LIGHT = "rgba(0, 0, 0, 0.6)";
export const ICON_DARK = "rgba(255, 255, 255, 0.7)";

// Shades chosen to meet WCAG AA: white labels on light primary, navy on dark,
// and the light warning icon against the shell.
export const PRIMARY_LIGHT = { main: "#0967d4", contrastText: "#ffffff" };
export const PRIMARY_DARK = { main: "#4ca2ff", contrastText: "#001a33" };
export const WARNING_LIGHT = { main: "#a15c00" };
