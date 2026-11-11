import type { Theme } from "@mui/material/styles";

// A tile's symbol and label need the extra height; its width can go narrower
// so that wide boards fit more columns before they scroll.
const GRID_MIN_CELL_WIDTH_PX = 88;
const GRID_MIN_CELL_HEIGHT_PX = 96;
const GRID_GAP_UNIT_PX = 8;
const GRID_GAP = "var(--grid-gap)";
const GRID_CELL_WIDTH = "var(--grid-cell-width)";
const GRID_CELL_HEIGHT = "var(--grid-cell-height)";

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
// the grid. The top and bottom padding is the page margin minus the padding
// the bars next to the grid keep against it (4px on a small screen, 8px on a
// wide one), so the space between a bar and the nearest tile comes to the page
// margin too.
const GRID_COMPACT_SPACING: GridSpacing = {
  inline: { paddingPx: 16, overflowHintPx: 8 },
  block: { paddingPx: 12, overflowHintPx: 8 },
};
const GRID_REGULAR_SPACING: GridSpacing = {
  inline: { paddingPx: 24, overflowHintPx: 16 },
  block: { paddingPx: 16, overflowHintPx: 8 },
};

const AXES = {
  inline: {
    feature: "min-width",
    visibleTracks: "--grid-visible-columns",
    padding: "--grid-inline-padding",
    inset: "--grid-inline-inset",
  },
  block: {
    feature: "min-height",
    visibleTracks: "--grid-visible-rows",
    padding: "--grid-block-padding",
    inset: "--grid-block-inset",
  },
} as const;

type GridAxis = (typeof AXES)[keyof typeof AXES];

interface GridLayoutOptions {
  rows: number;
  columns: number;
  gap: number;
}

// A snapped track sits half the axis' inset from the edge, which leaves the
// same hint of its neighbors on both sides.
export const gridCellSx = {
  flex: 1,
  minWidth: GRID_CELL_WIDTH,
  minHeight: GRID_CELL_HEIGHT,
  scrollMarginInline: `calc(var(${AXES.inline.inset}) / 2)`,
  scrollSnapAlign: "none start",
} as const;

// Rows snap on the block axis and cells on the inline axis. A cell that snapped
// on both would count as snapped through its row alone, and Safari re-snaps to
// a snapped area that gains focus, dragging the board to the focused column.
export const gridRowSx = {
  flex: 1,
  minHeight: GRID_CELL_HEIGHT,
  gap: GRID_GAP,
  scrollMarginBlock: `calc(var(${AXES.block.inset}) / 2)`,
  scrollSnapAlign: "start none",
} as const;

export const gridViewportSx = {
  containerType: "size",
  height: "100%",
  overflow: "auto",
  scrollSnapType: "both proximity",
} as const;

export function createGridContentSx(
  theme: Theme,
  { rows, columns, gap }: GridLayoutOptions,
) {
  const gapPx = gapUnitsToPx(gap);

  return {
    "--grid-gap": formatPx(gapPx),
    "--grid-cell-width": createCellSizeExpression(
      "100cqi",
      AXES.inline,
      GRID_MIN_CELL_WIDTH_PX,
    ),
    "--grid-cell-height": createCellSizeExpression(
      "100cqb",
      AXES.block,
      GRID_MIN_CELL_HEIGHT_PX,
    ),
    minWidth: createGridExtentExpression(GRID_CELL_WIDTH, AXES.inline, columns),
    // A definite height, not a minimum: rows share it equally, so a row is
    // always the fitted cell height. With only a minimum the height would be
    // indefinite, rows would size to their content, and a tile taller than the
    // fitted height would push the next row's overflow hint out of view.
    height: createGridExtentExpression(GRID_CELL_HEIGHT, AXES.block, rows),
    gap: GRID_GAP,
    px: `var(${AXES.inline.padding})`,
    py: `var(${AXES.block.padding})`,
    [theme.breakpoints.down("sm")]: createSpacingRules(
      rows,
      columns,
      gapPx,
      GRID_COMPACT_SPACING,
    ),
    [theme.breakpoints.up("sm")]: createSpacingRules(
      rows,
      columns,
      gapPx,
      GRID_REGULAR_SPACING,
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
    ...createAxisRules(
      AXES.inline,
      columns,
      GRID_MIN_CELL_WIDTH_PX,
      gapPx,
      spacing.inline,
    ),
    ...createAxisRules(
      AXES.block,
      rows,
      GRID_MIN_CELL_HEIGHT_PX,
      gapPx,
      spacing.block,
    ),
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
  minCellSizePx: number,
  gapPx: number,
  spacing: AxisSpacing,
): AxisRules {
  const rules: AxisRules = {
    [axis.padding]: formatPx(spacing.paddingPx),
    ...createVisibleTrackProperties(axis, 1, count, gapPx, spacing),
  };

  for (let visibleTracks = 2; visibleTracks <= count; visibleTracks++) {
    const thresholdPx =
      visibleTracks * minCellSizePx +
      (visibleTracks - 1) * gapPx +
      calculateInsetPx(visibleTracks, count, gapPx, spacing);

    rules[`@container (${axis.feature}: ${formatPx(thresholdPx)})`] =
      createVisibleTrackProperties(axis, visibleTracks, count, gapPx, spacing);
  }

  return rules;
}

function createVisibleTrackProperties(
  axis: GridAxis,
  visibleTracks: number,
  count: number,
  gapPx: number,
  spacing: AxisSpacing,
): Record<string, string | number> {
  return {
    [axis.visibleTracks]: visibleTracks,
    [axis.inset]: formatPx(
      calculateInsetPx(visibleTracks, count, gapPx, spacing),
    ),
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
  { paddingPx, overflowHintPx }: AxisSpacing,
): number {
  const isScrollable = visibleTracks < count;

  return isScrollable ? paddingPx + gapPx + overflowHintPx : 2 * paddingPx;
}

function createCellSizeExpression(
  viewportSize: string,
  axis: GridAxis,
  minCellSizePx: number,
): string {
  const visibleTracks = `var(${axis.visibleTracks})`;
  const availableSize = `${viewportSize} - var(${axis.inset}) - (${visibleTracks} - 1) * ${GRID_GAP}`;

  return `max(${formatPx(minCellSizePx)}, calc((${availableSize}) / ${visibleTracks}))`;
}

function createGridExtentExpression(
  cellSize: string,
  axis: GridAxis,
  count: number,
): string {
  return `calc(${count} * ${cellSize} + ${count - 1} * ${GRID_GAP} + 2 * var(${axis.padding}))`;
}

function gapUnitsToPx(gap: number): number {
  return gap * GRID_GAP_UNIT_PX;
}

function formatPx(value: number): string {
  return `${value}px`;
}
