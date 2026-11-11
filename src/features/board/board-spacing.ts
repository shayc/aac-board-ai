// Spacing of the board screen, in theme spacing units, below and from the `sm`
// breakpoint. The message bar, the bars around the grid, and the grid itself
// all read these, so the space between any two of them changes in one place.

// Space between the screen's edges and the board's content, and between one
// bar and the next.
export const PAGE_MARGIN = { xs: 2, sm: 3 } as const;

// Room a bar keeps between its controls and the tiles scrolling past it. The
// grid pads itself by the page margin minus this, so a bar and the nearest
// tile end up one page margin apart.
export const SCROLL_CLEARANCE = { xs: 0.5, sm: 1 } as const;
