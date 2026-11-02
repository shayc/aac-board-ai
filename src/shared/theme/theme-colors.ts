// SHELL paints the bars and chrome; CONTENT is the reading surface.
// Light is a soft off-white so white tiles and surfaces keep a visible edge.
export const SHELL_LIGHT = "#f3f4f7";
export const SHELL_DARK = "#0e1014";

export const CONTENT_LIGHT = "#f3f4f7";
export const CONTENT_DARK = "#0e1014";

// Containers (message bar, controls) sit one step above the shell.
export const SURFACE_LIGHT = "#ffffff";
export const SURFACE_DARK = "#1a1d23";

// Teal, at matched tones in both modes: distinct from every Fitzgerald tile
// category color. Dark pairs it with dark ink for icon contrast.
export const PRIMARY_LIGHT = { main: "#0d9488", contrastText: "#ffffff" };
export const PRIMARY_DARK = { main: "#38c6b4", contrastText: "#042f2e" };

// Amber marks editing (backspace), distinct from navigating and speaking.
export const EDIT_LIGHT = { fill: "#ffe7bf", ink: "#7a4f00" };
export const EDIT_DARK = { fill: "#3d3018", ink: "#ffd180" };
