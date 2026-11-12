// Spacing of the board screen, in theme spacing units, below and from the `sm`
// breakpoint. The board lays out its bars with these and the grid pads itself
// with them, so the space between any two of them changes in one place.

// Space between the screen's edges and the board's content, and between one
// bar and the next.
export const PAGE_MARGIN = { xs: 2, sm: 3 } as const;

// Room kept above and below the grid, between the tiles scrolling past and a
// bar's controls or the screen's edge.
export const SCROLL_CLEARANCE = { xs: 0.5, sm: 1 } as const;

// The grid's sides are padded by the page margin, so tiles line up with the
// bars around the grid. Its top and bottom are the page margin minus the
// clearance already kept above and below the grid, so the first and last rows
// end up one page margin from whatever is next to them.
export const GRID_PADDING = {
  inline: PAGE_MARGIN,
  block: {
    xs: PAGE_MARGIN.xs - SCROLL_CLEARANCE.xs,
    sm: PAGE_MARGIN.sm - SCROLL_CLEARANCE.sm,
  },
} as const;
