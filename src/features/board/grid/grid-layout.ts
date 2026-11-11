import type { Theme } from "@mui/material/styles";
import { PAGE_MARGIN, SCROLL_CLEARANCE } from "../board-spacing";

// A tile's symbol and label need the extra height; its width can go narrower
// so that wide boards fit more columns before they scroll.
const GRID_MIN_CELL_WIDTH_PX = 88;
const GRID_MIN_CELL_HEIGHT_PX = 96;
// The theme's spacing unit as a number: container queries compare against
// lengths, and the theme only offers its unit as a CSS variable.
const GRID_SPACING_UNIT_PX = 8;
const GRID_GAP = "var(--grid-gap)";

const AXES = {
  inline: {
    feature: "min-width",
    viewportSize: "100cqi",
    minCellSizePx: GRID_MIN_CELL_WIDTH_PX,
    cellSize: "--grid-cell-width",
    visibleTracks: "--grid-visible-columns",
    padding: "--grid-inline-padding",
    inset: "--grid-inline-inset",
  },
  block: {
    feature: "min-height",
    viewportSize: "100cqb",
    minCellSizePx: GRID_MIN_CELL_HEIGHT_PX,
    cellSize: "--grid-cell-height",
    visibleTracks: "--grid-visible-rows",
    padding: "--grid-block-padding",
    inset: "--grid-block-inset",
  },
} as const;

type GridAxis = (typeof AXES)[keyof typeof AXES];

const GRID_CELL_WIDTH = `var(${AXES.inline.cellSize})`;
const GRID_CELL_HEIGHT = `var(${AXES.block.cellSize})`;

interface AxisSpacing {
  // Space between the grid's edge and its first and last track.
  paddingPx: number;
  // How much of the next track shows past the edge of an axis that scrolls, so
  // the user can tell the board scrolls that way.
  overflowHintPx: number;
}

interface GridSpacing {
  inline: AxisSpacing;
  block: AxisSpacing;
}

// The side padding is the page margin, so tiles line up with the bars around
// the grid. The top and bottom padding is the page margin minus the clearance
// the board keeps above and below the grid, so the first and last rows end up
// one page margin from whatever is next to them. Keyed like the board's
// spacing: below and from "sm".
const GRID_SPACING: Record<"xs" | "sm", GridSpacing> = {
  xs: {
    inline: {
      paddingPx: spacingUnitsToPx(PAGE_MARGIN.xs),
      overflowHintPx: 8,
    },
    block: {
      paddingPx: spacingUnitsToPx(PAGE_MARGIN.xs - SCROLL_CLEARANCE.xs),
      overflowHintPx: 8,
    },
  },
  sm: {
    inline: {
      paddingPx: spacingUnitsToPx(PAGE_MARGIN.sm),
      overflowHintPx: 16,
    },
    block: {
      paddingPx: spacingUnitsToPx(PAGE_MARGIN.sm - SCROLL_CLEARANCE.sm),
      overflowHintPx: 16,
    },
  },
};

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
    [theme.breakpoints.down("sm")]: createScrollPadding(gapPx, GRID_SPACING.xs),
    [theme.breakpoints.up("sm")]: createScrollPadding(gapPx, GRID_SPACING.sm),
  };
}

// A track scrolled to rest sits half the scrolling inset from the edge, which
// leaves the same hint of its neighbors on both sides. The hint is narrower
// than this padding, so a hinted tile that takes focus counts as out of view
// and the browser scrolls all of it in.
function createScrollPadding(gapPx: number, spacing: GridSpacing) {
  return {
    scrollPaddingInline: formatPx(
      calculateScrollingInsetPx(gapPx, spacing.inline) / 2,
    ),
    scrollPaddingBlock: formatPx(
      calculateScrollingInsetPx(gapPx, spacing.block) / 2,
    ),
  };
}

export function createGridContentSx(
  theme: Theme,
  { rows, columns, gap }: GridLayoutOptions,
) {
  const gapPx = spacingUnitsToPx(gap);

  return {
    "--grid-gap": formatPx(gapPx),
    [AXES.inline.cellSize]: createCellSizeExpression(AXES.inline),
    [AXES.block.cellSize]: createCellSizeExpression(AXES.block),
    minWidth: createGridExtentExpression(AXES.inline, columns),
    // A definite height, not a minimum: rows share it equally, so a row is
    // always the fitted cell height. With only a minimum the height would be
    // indefinite, rows would size to their content, and a tile taller than the
    // fitted height would push the next row's overflow hint out of view.
    height: createGridExtentExpression(AXES.block, rows),
    gap: GRID_GAP,
    px: `var(${AXES.inline.padding})`,
    py: `var(${AXES.block.padding})`,
    [theme.breakpoints.down("sm")]: createSpacingRules(
      rows,
      columns,
      gapPx,
      GRID_SPACING.xs,
    ),
    [theme.breakpoints.up("sm")]: createSpacingRules(
      rows,
      columns,
      gapPx,
      GRID_SPACING.sm,
    ),
  };
}

function createSpacingRules(
  rows: number,
  columns: number,
  gapPx: number,
  spacing: GridSpacing,
) {
  return {
    ...createAxisRules(AXES.inline, columns, gapPx, spacing.inline),
    ...createAxisRules(AXES.block, rows, gapPx, spacing.block),
  };
}

type AxisRules = Record<
  string,
  string | number | Record<string, string | number>
>;

// One track is visible unless a container query finds room for more.
function createAxisRules(
  axis: GridAxis,
  count: number,
  gapPx: number,
  spacing: AxisSpacing,
): AxisRules {
  const rules: AxisRules = {
    [axis.padding]: formatPx(spacing.paddingPx),
    ...createVisibleTrackProperties(
      axis,
      1,
      calculateInsetPx(1, count, gapPx, spacing),
    ),
  };

  for (let visibleTracks = 2; visibleTracks <= count; visibleTracks++) {
    const insetPx = calculateInsetPx(visibleTracks, count, gapPx, spacing);
    const thresholdPx =
      visibleTracks * axis.minCellSizePx +
      (visibleTracks - 1) * gapPx +
      insetPx;

    rules[`@container (${axis.feature}: ${formatPx(thresholdPx)})`] =
      createVisibleTrackProperties(axis, visibleTracks, insetPx);
  }

  return rules;
}

function createVisibleTrackProperties(
  axis: GridAxis,
  visibleTracks: number,
  insetPx: number,
): Record<string, string | number> {
  return {
    [axis.visibleTracks]: visibleTracks,
    [axis.inset]: formatPx(insetPx),
  };
}

// The inset is the part of the viewport that whole tracks leave free. An axis
// that fits needs only its padding on both sides. An axis that scrolls needs
// its padding on one side and, on the other, a gap and the hint of the next
// track; at the far end of the scroll the two sides swap.
function calculateInsetPx(
  visibleTracks: number,
  count: number,
  gapPx: number,
  spacing: AxisSpacing,
): number {
  const isScrollable = visibleTracks < count;

  return isScrollable
    ? calculateScrollingInsetPx(gapPx, spacing)
    : 2 * spacing.paddingPx;
}

function calculateScrollingInsetPx(
  gapPx: number,
  { paddingPx, overflowHintPx }: AxisSpacing,
): number {
  return paddingPx + gapPx + overflowHintPx;
}

function createCellSizeExpression(axis: GridAxis): string {
  const visibleTracks = `var(${axis.visibleTracks})`;
  const availableSize = `${axis.viewportSize} - var(${axis.inset}) - (${visibleTracks} - 1) * ${GRID_GAP}`;

  return `max(${formatPx(axis.minCellSizePx)}, calc((${availableSize}) / ${visibleTracks}))`;
}

function createGridExtentExpression(axis: GridAxis, count: number): string {
  return `calc(${count} * var(${axis.cellSize}) + ${count - 1} * ${GRID_GAP} + 2 * var(${axis.padding}))`;
}

function spacingUnitsToPx(units: number): number {
  return units * GRID_SPACING_UNIT_PX;
}

function formatPx(value: number): string {
  return `${value}px`;
}
