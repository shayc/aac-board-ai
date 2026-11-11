import type { Theme } from "@mui/material/styles";
import { PAGE_MARGIN, SCROLL_CLEARANCE } from "../board-spacing";

// The theme's spacing unit as a number: container queries compare against
// lengths, and the theme only offers its unit as a CSS variable.
const GRID_SPACING_UNIT_PX = 8;
const GRID_GAP = "var(--grid-gap)";

type Breakpoint = "xs" | "sm";

// How much of the next row or column shows past the edge of an axis that
// scrolls, so the user can tell the board scrolls that way. Keyed like the
// board's spacing: below and from "sm".
const OVERFLOW_HINT_PX: Record<Breakpoint, number> = { xs: 8, sm: 16 };

// Everything that differs between laying out columns and laying out rows.
const AXES = {
  inline: {
    containerFeature: "min-width",
    viewportSize: "100cqi",
    cellSize: "--grid-cell-width",
    // A tile's width can go narrower than its height, so that wide boards fit
    // more columns before they scroll.
    minCellSizePx: 88,
    // The side padding is the page margin, so tiles line up with the bars
    // around the grid.
    paddingPx: {
      xs: spacingUnitsToPx(PAGE_MARGIN.xs),
      sm: spacingUnitsToPx(PAGE_MARGIN.sm),
    },
    paddingProperty: "px",
    extentProperty: "minWidth",
  },
  block: {
    containerFeature: "min-height",
    viewportSize: "100cqb",
    cellSize: "--grid-cell-height",
    // A tile's symbol and label need the extra height.
    minCellSizePx: 96,
    // The top and bottom padding is the page margin minus the clearance the
    // board keeps above and below the grid, so the first and last rows end up
    // one page margin from whatever is next to them.
    paddingPx: {
      xs: spacingUnitsToPx(PAGE_MARGIN.xs - SCROLL_CLEARANCE.xs),
      sm: spacingUnitsToPx(PAGE_MARGIN.sm - SCROLL_CLEARANCE.sm),
    },
    paddingProperty: "py",
    // A definite height, not a minimum: rows share it equally, so a row is
    // always the fitted cell height. With only a minimum the height would be
    // indefinite, rows would size to their content, and a tile taller than the
    // fitted height would push the next row's overflow hint out of view.
    extentProperty: "height",
  },
} as const;

type GridAxis = (typeof AXES)[keyof typeof AXES];

const GRID_CELL_WIDTH = `var(${AXES.inline.cellSize})`;
const GRID_CELL_HEIGHT = `var(${AXES.block.cellSize})`;

interface GridLayoutOptions {
  rows: number;
  columns: number;
  gap: number;
}

export const gridCellSx = {
  flex: 1,
  minWidth: GRID_CELL_WIDTH,
  minHeight: GRID_CELL_HEIGHT,
  scrollSnapAlign: "none start",
} as const;

// Rows snap on the block axis and cells on the inline axis. A cell that snapped
// on both would count as snapped through its row alone, and Safari re-snaps to
// a snapped area that gains focus, dragging the board to the focused column.
export const gridRowSx = {
  flex: 1,
  minHeight: GRID_CELL_HEIGHT,
  gap: GRID_GAP,
  scrollSnapAlign: "start none",
} as const;

export function createGridViewportSx(theme: Theme, gap: number) {
  const gapPx = spacingUnitsToPx(gap);

  return {
    containerType: "size",
    height: "100%",
    overflow: "auto",
    scrollSnapType: "both proximity",
    [theme.breakpoints.down("sm")]: createScrollPadding("xs", gapPx),
    [theme.breakpoints.up("sm")]: createScrollPadding("sm", gapPx),
  };
}

// A track scrolled to rest sits half the scrolling inset from the edge, which
// leaves the same hint of its neighbors on both sides. The hint is narrower
// than this padding, so a hinted tile that takes focus counts as out of view
// and the browser scrolls all of it in.
function createScrollPadding(breakpoint: Breakpoint, gapPx: number) {
  return {
    scrollPaddingInline: formatPx(
      calculateScrollingInsetPx(AXES.inline, breakpoint, gapPx) / 2,
    ),
    scrollPaddingBlock: formatPx(
      calculateScrollingInsetPx(AXES.block, breakpoint, gapPx) / 2,
    ),
  };
}

export function createGridContentSx(
  theme: Theme,
  { rows, columns, gap }: GridLayoutOptions,
) {
  const gapPx = spacingUnitsToPx(gap);

  function createBreakpointRules(breakpoint: Breakpoint) {
    return {
      ...createAxisRules(AXES.inline, breakpoint, columns, gapPx),
      ...createAxisRules(AXES.block, breakpoint, rows, gapPx),
    };
  }

  return {
    "--grid-gap": formatPx(gapPx),
    gap: GRID_GAP,
    [theme.breakpoints.down("sm")]: createBreakpointRules("xs"),
    [theme.breakpoints.up("sm")]: createBreakpointRules("sm"),
  };
}

type AxisRules = Record<string, string | Record<string, string>>;

// Pads the axis, sizes the grid to hold every track, and sizes a cell to fit
// whole tracks into the viewport. One track is visible unless a container
// query finds room for more.
function createAxisRules(
  axis: GridAxis,
  breakpoint: Breakpoint,
  trackCount: number,
  gapPx: number,
): AxisRules {
  const paddingPx = axis.paddingPx[breakpoint];
  const gapsAndPaddingPx = (trackCount - 1) * gapPx + 2 * paddingPx;

  const rules: AxisRules = {
    [axis.paddingProperty]: formatPx(paddingPx),
    [axis.extentProperty]: `calc(${trackCount} * var(${axis.cellSize}) + ${formatPx(gapsAndPaddingPx)})`,
    ...createTrackFit(axis, breakpoint, trackCount, 1, gapPx).cellSize,
  };

  for (let visibleTracks = 2; visibleTracks <= trackCount; visibleTracks++) {
    const { thresholdPx, cellSize } = createTrackFit(
      axis,
      breakpoint,
      trackCount,
      visibleTracks,
      gapPx,
    );

    rules[`@container (${axis.containerFeature}: ${formatPx(thresholdPx)})`] =
      cellSize;
  }

  return rules;
}

// The cell size that fits a number of whole tracks into the viewport, and the
// smallest viewport those tracks fit into at their minimum size.
function createTrackFit(
  axis: GridAxis,
  breakpoint: Breakpoint,
  trackCount: number,
  visibleTracks: number,
  gapPx: number,
) {
  const isScrollable = visibleTracks < trackCount;
  const insetPx = isScrollable
    ? calculateScrollingInsetPx(axis, breakpoint, gapPx)
    : 2 * axis.paddingPx[breakpoint];
  const gapsAndInsetPx = (visibleTracks - 1) * gapPx + insetPx;
  const fittedCellSize = `calc((${axis.viewportSize} - ${formatPx(gapsAndInsetPx)}) / ${visibleTracks})`;

  return {
    thresholdPx: visibleTracks * axis.minCellSizePx + gapsAndInsetPx,
    cellSize: {
      [axis.cellSize]: `max(${formatPx(axis.minCellSizePx)}, ${fittedCellSize})`,
    },
  };
}

// The inset is the part of the viewport that whole tracks leave free. An axis
// that fits needs only its padding on both sides. An axis that scrolls needs
// its padding on one side and, on the other, a gap and the hint of the next
// track; at the far end of the scroll the two sides swap.
function calculateScrollingInsetPx(
  axis: GridAxis,
  breakpoint: Breakpoint,
  gapPx: number,
): number {
  return axis.paddingPx[breakpoint] + gapPx + OVERFLOW_HINT_PX[breakpoint];
}

function spacingUnitsToPx(units: number): number {
  return units * GRID_SPACING_UNIT_PX;
}

function formatPx(value: number): string {
  return `${value}px`;
}
