import type { Theme } from "@mui/material/styles";
import { GRID_PADDING } from "../board-spacing";

// Container-query thresholds require literal lengths for the theme's spacing unit.
const GRID_SPACING_UNIT_PX = 8;
const GRID_GAP = "var(--grid-gap)";

type Breakpoint = "xs" | "sm";

const OVERFLOW_HINT_PX: Record<Breakpoint, number> = { xs: 8, sm: 16 };

const AXES = {
  inline: {
    containerFeature: "min-width",
    viewportSize: "100cqi",
    cellSize: "--grid-cell-width",
    // Narrower than the height so wide boards fit more columns before scrolling.
    minCellSizePx: 88,
    paddingPx: {
      xs: spacingUnitsToPx(GRID_PADDING.inline.xs),
      sm: spacingUnitsToPx(GRID_PADDING.inline.sm),
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
    paddingPx: {
      xs: spacingUnitsToPx(GRID_PADDING.block.xs),
      sm: spacingUnitsToPx(GRID_PADDING.block.sm),
    },
    paddingProperty: "py",
    // A definite height keeps content-sized rows from displacing the overflow hint.
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

// Keep row and cell snap axes separate to prevent Safari focus from shifting columns.
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

// Padding wider than the hint makes keyboard focus scroll the whole tile into view.
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
      ...createAxisRules({
        axis: AXES.inline,
        breakpoint,
        trackCount: columns,
        gapPx,
      }),
      ...createAxisRules({
        axis: AXES.block,
        breakpoint,
        trackCount: rows,
        gapPx,
      }),
    };
  }

  return {
    "--grid-gap": formatPx(gapPx),
    gap: GRID_GAP,
    [theme.breakpoints.down("sm")]: createBreakpointRules("xs"),
    [theme.breakpoints.up("sm")]: createBreakpointRules("sm"),
  };
}

interface AxisLayout {
  axis: GridAxis;
  breakpoint: Breakpoint;
  trackCount: number;
  gapPx: number;
}

type AxisRules = Record<string, string | Record<string, string>>;

function createAxisRules(layout: AxisLayout): AxisRules {
  const { axis, breakpoint, trackCount, gapPx } = layout;
  const paddingPx = axis.paddingPx[breakpoint];
  const gapsAndPaddingPx = (trackCount - 1) * gapPx + 2 * paddingPx;

  const rules: AxisRules = {
    [axis.paddingProperty]: formatPx(paddingPx),
    [axis.extentProperty]: `calc(${trackCount} * var(${axis.cellSize}) + ${formatPx(gapsAndPaddingPx)})`,
    ...createTrackFit(layout, 1).cellSize,
  };

  for (let visibleTracks = 2; visibleTracks <= trackCount; visibleTracks++) {
    const { minViewportSizePx, cellSize } = createTrackFit(
      layout,
      visibleTracks,
    );

    rules[
      `@container (${axis.containerFeature}: ${formatPx(minViewportSizePx)})`
    ] = cellSize;
  }

  return rules;
}

function createTrackFit(
  { axis, breakpoint, trackCount, gapPx }: AxisLayout,
  visibleTracks: number,
) {
  // A fitting axis is inset by its padding on both sides. A scrolling axis has
  // padding on one side and a gap plus the next track's hint on the other.
  const isScrollable = visibleTracks < trackCount;
  const insetPx = isScrollable
    ? calculateScrollingInsetPx(axis, breakpoint, gapPx)
    : 2 * axis.paddingPx[breakpoint];
  const gapsAndInsetPx = (visibleTracks - 1) * gapPx + insetPx;
  const fittedCellSize = `calc((${axis.viewportSize} - ${formatPx(gapsAndInsetPx)}) / ${visibleTracks})`;

  return {
    minViewportSizePx: visibleTracks * axis.minCellSizePx + gapsAndInsetPx,
    cellSize: {
      [axis.cellSize]: `max(${formatPx(axis.minCellSizePx)}, ${fittedCellSize})`,
    },
  };
}

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
