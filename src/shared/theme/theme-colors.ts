// SHELL paints the bars and chrome; CONTENT is the reading surface.
// Light is a soft off-white so white tiles and surfaces keep a visible edge.
export const SHELL_LIGHT = "#f3f4f7";
export const SHELL_DARK = "#0e1014";

export const CONTENT_LIGHT = "#f3f4f7";
export const CONTENT_DARK = "#0e1014";

// Containers (message bar, controls) sit one step above the shell.
export const SURFACE_LIGHT = "#ffffff";
export const SURFACE_DARK = "#1a1d23";

// Primary is an Apple-style system blue at matched tones in both modes: the
// color people already read as "tap this", and saturated enough to stay
// distinct from the pale blue Fitzgerald tiles.
export const PRIMARY_LIGHT = { main: "#007aff", contrastText: "#ffffff" };
export const PRIMARY_DARK = { main: "#0a84ff", contrastText: "#ffffff" };

// Amber marks editing (backspace), distinct from navigating and speaking.
export const EDIT_LIGHT = { fill: "#ffe7bf", ink: "#7a4f00" };
export const EDIT_DARK = { fill: "#3d3018", ink: "#ffd180" };
