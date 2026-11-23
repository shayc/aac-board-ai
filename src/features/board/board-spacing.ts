export const PAGE_MARGIN = { xs: 2, sm: 3 } as const;

// At a scroll end, a bar sits this far, plus the overflow hint and one tile
// gap, from the nearest whole row.
export const SCROLL_CLEARANCE = { xs: 0.5, sm: 1 } as const;

// Twice the phone's page margin pulls the controls under the grid in toward the
// thumb, about where Safari's toolbar puts its buttons.
export const BOTTOM_CONTROLS_INSET = 2 * PAGE_MARGIN.xs;

export const GRID_PADDING = {
  inline: PAGE_MARGIN,
  block: {
    xs: PAGE_MARGIN.xs - SCROLL_CLEARANCE.xs,
    sm: PAGE_MARGIN.sm - SCROLL_CLEARANCE.sm,
  },
} as const;
