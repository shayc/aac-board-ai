// SHELL paints the bars and chrome; CONTENT is the reading surface.
// Light is a soft off-white so white tiles and surfaces keep a visible edge.
export const SHELL_LIGHT = "#f3f4f7";
export const SHELL_DARK = "#0e1014";

export const CONTENT_LIGHT = "#f3f4f7";
export const CONTENT_DARK = "#0e1014";

// Containers (message bar, controls) sit one step above the shell.
export const SURFACE_LIGHT = "#ffffff";
export const SURFACE_DARK = "#1a1d23";

// One neutral tone for every icon, matched to text.secondary in both modes
// (MUI's default action.active is 54% in light but full white in dark).
export const ICON_LIGHT = "rgba(0, 0, 0, 0.6)";
export const ICON_DARK = "rgba(255, 255, 255, 0.7)";

// Primary is system blue, the color people already read as "tap this", at
// the darker shade Apple uses for accessible links: text and white labels on it
// meet WCAG AA (>= 4.5:1). Dark mode uses a lighter tone with navy ink for the
// same contrast. Saturated enough to stay distinct from the pale blue tiles.
export const PRIMARY_LIGHT = { main: "#0066cc", contrastText: "#ffffff" };
export const PRIMARY_DARK = { main: "#4ca2ff", contrastText: "#001a33" };

// Amber marks editing (backspace), distinct from navigating and speaking.
export const EDIT_LIGHT = { fill: "#ffe7bf", ink: "#7a4f00" };
export const EDIT_DARK = { fill: "#3d3018", ink: "#ffd180" };
