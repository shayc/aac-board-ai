import type { Theme } from "@mui/material/styles";
import { shortLandscape } from "@shared/theme/short-landscape";
import { GRID_PADDING } from "../board-spacing";

// Container-query thresholds require literal lengths for the theme's spacing unit.
const GRID_SPACING_UNIT_PX = 8;
const GRID_GAP_PX = spacingUnitsToPx(1);
const GRID_GAP = formatPx(GRID_GAP_PX);

type Breakpoint = "xs" | "sm";

const OVERFLOW_HINT_PX: Record<Breakpoint, number> = { xs: 8, sm: 16 };

const AXES = {
  inline: {
    containerFeature: "min-width",
    viewportSize: "100cqi",
    cellSizeProperty: "--grid-cell-width",
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
    cellSizeProperty: "--grid-cell-height",
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

const GRID_CELL_WIDTH = `var(${AXES.inline.cellSizeProperty})`;
const GRID_CELL_HEIGHT = `var(${AXES.block.cellSizeProperty})`;

export const gridCellSx = {
  flex: 1,
  minWidth: GRID_CELL_WIDTH,
  minHeight: GRID_CELL_HEIGHT,
  scrollSnapAlign: "none start",
} as const;

// Rows and cells snap on separate axes, which stops Safari focus from
// shifting columns.
export const gridRowSx = {
  flex: 1,
  minHeight: GRID_CELL_HEIGHT,
  gap: GRID_GAP,
  scrollSnapAlign: "start none",
} as const;

export function gridViewportSx(theme: Theme) {
  return {
    containerType: "size",
    height: "100%",
    overflow: "auto",
    scrollSnapType: "both proximity",
    [theme.breakpoints.down("sm")]: buildScrollPadding("xs"),
    [theme.breakpoints.up("sm")]: buildScrollPadding("sm"),
    // Declared last so it overrides the wide rules on a phone on its side.
    [shortLandscape(theme)]: buildScrollPadding("xs"),
  };
}

// Padding wider than the hint makes keyboard focus scroll the whole tile into view.
function buildScrollPadding(breakpoint: Breakpoint) {
  return {
    scrollPaddingInline: formatPx(
      scrollingInsetPx(AXES.inline, breakpoint) / 2,
    ),
    scrollPaddingBlock: formatPx(scrollingInsetPx(AXES.block, breakpoint) / 2),
  };
}

interface GridDimensions {
  rows: number;
  columns: number;
}

export function gridContentSx(theme: Theme, { rows, columns }: GridDimensions) {
  function buildBreakpointRules(breakpoint: Breakpoint) {
    return {
      ...buildAxisRules({
        axis: AXES.inline,
        breakpoint,
        trackCount: columns,
      }),
      ...buildAxisRules({ axis: AXES.block, breakpoint, trackCount: rows }),
    };
  }

  return {
    gap: GRID_GAP,
    [theme.breakpoints.down("sm")]: buildBreakpointRules("xs"),
    [theme.breakpoints.up("sm")]: buildBreakpointRules("sm"),
    [shortLandscape(theme)]: buildBreakpointRules("xs"),
  };
}

interface AxisLayout {
  axis: GridAxis;
  breakpoint: Breakpoint;
  trackCount: number;
}

type AxisRules = Record<string, string | Record<string, string>>;

function buildAxisRules(layout: AxisLayout): AxisRules {
  const { axis, breakpoint, trackCount } = layout;
  const paddingPx = axis.paddingPx[breakpoint];
  const gapsAndPaddingPx = (trackCount - 1) * GRID_GAP_PX + 2 * paddingPx;

  const rules: AxisRules = {
    [axis.paddingProperty]: formatPx(paddingPx),
    [axis.extentProperty]: `calc(${trackCount} * var(${axis.cellSizeProperty}) + ${formatPx(gapsAndPaddingPx)})`,
    ...buildTrackFit(layout, 1).cellSizeRule,
  };

  for (let visibleTracks = 2; visibleTracks <= trackCount; visibleTracks++) {
    const { minViewportSizePx, cellSizeRule } = buildTrackFit(
      layout,
      visibleTracks,
    );

    rules[
      `@container (${axis.containerFeature}: ${formatPx(minViewportSizePx)})`
    ] = cellSizeRule;
  }

  return rules;
}

function buildTrackFit(
  { axis, breakpoint, trackCount }: AxisLayout,
  visibleTracks: number,
) {
  // A fitting axis is inset by its padding on both sides. A scrolling axis has
  // padding on one side and a gap plus the next track's hint on the other.
  const isScrollable = visibleTracks < trackCount;
  const insetPx = isScrollable
    ? scrollingInsetPx(axis, breakpoint)
    : 2 * axis.paddingPx[breakpoint];
  const gapsAndInsetPx = (visibleTracks - 1) * GRID_GAP_PX + insetPx;
  const fittedCellSize = `calc((${axis.viewportSize} - ${formatPx(gapsAndInsetPx)}) / ${visibleTracks})`;

  return {
    minViewportSizePx: visibleTracks * axis.minCellSizePx + gapsAndInsetPx,
    cellSizeRule: {
      [axis.cellSizeProperty]: `max(${formatPx(axis.minCellSizePx)}, ${fittedCellSize})`,
    },
  };
}

function scrollingInsetPx(axis: GridAxis, breakpoint: Breakpoint): number {
  return (
    axis.paddingPx[breakpoint] + GRID_GAP_PX + OVERFLOW_HINT_PX[breakpoint]
  );
}

function spacingUnitsToPx(units: number): number {
  return units * GRID_SPACING_UNIT_PX;
}

function formatPx(value: number): string {
  return `${value}px`;
}
