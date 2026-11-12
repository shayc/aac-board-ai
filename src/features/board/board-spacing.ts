export const PAGE_MARGIN = { xs: 2, sm: 3 } as const;

export const SCROLL_CLEARANCE = { xs: 0.5, sm: 1 } as const;

export const GRID_PADDING = {
  inline: PAGE_MARGIN,
  block: {
    xs: PAGE_MARGIN.xs - SCROLL_CLEARANCE.xs,
    sm: PAGE_MARGIN.sm - SCROLL_CLEARANCE.sm,
  },
} as const;
