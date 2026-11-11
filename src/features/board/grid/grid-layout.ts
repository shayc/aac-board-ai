import type { Theme } from "@mui/material/styles";

// A tile's symbol and label need the extra height; its width can go narrower
// so that wide boards fit more columns before they scroll.
const GRID_MIN_CELL_WIDTH_PX = 72;
const GRID_MIN_CELL_HEIGHT_PX = 96;
const GRID_GAP_UNIT_PX = 8;
const GRID_COMPACT_PADDING_PX = 16;
const GRID_REGULAR_PADDING_PX = 24;
const GRID_PADDING = "var(--grid-padding)";
const GRID_GAP = "var(--grid-gap)";
const GRID_CELL_WIDTH = "var(--grid-cell-width)";
const GRID_CELL_HEIGHT = "var(--grid-cell-height)";

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

export function createGridViewportSx(theme: Theme) {
  return {
    "--grid-padding": formatPx(GRID_REGULAR_PADDING_PX),
    containerType: "size",
    height: "100%",
    overflow: "auto",
    scrollSnapType: "both proximity",
    scrollPadding: GRID_PADDING,
    [theme.breakpoints.down("sm")]: {
      "--grid-padding": formatPx(GRID_COMPACT_PADDING_PX),
    },
  };
}

export function createGridContentSx(
  theme: Theme,
  { rows, columns, gap }: GridLayoutOptions,
) {
  const gapPx = gapUnitsToPx(gap);

  return {
    "--grid-visible-columns": 1,
    "--grid-visible-rows": 1,
    "--grid-gap": formatPx(gapPx),
    "--grid-cell-width": createCellSizeExpression(
      "100cqi",
      "var(--grid-visible-columns)",
      GRID_MIN_CELL_WIDTH_PX,
    ),
    "--grid-cell-height": createCellSizeExpression(
      "100cqb",
      "var(--grid-visible-rows)",
      GRID_MIN_CELL_HEIGHT_PX,
    ),
    minWidth: createGridExtentExpression(GRID_CELL_WIDTH, columns),
    minHeight: createGridExtentExpression(GRID_CELL_HEIGHT, rows),
    gap: GRID_GAP,
    p: GRID_PADDING,
    [theme.breakpoints.down("sm")]: createVisibleTrackQueries(
      rows,
      columns,
      gapPx,
      GRID_COMPACT_PADDING_PX,
    ),
    [theme.breakpoints.up("sm")]: createVisibleTrackQueries(
      rows,
      columns,
      gapPx,
      GRID_REGULAR_PADDING_PX,
    ),
  };
}

function createVisibleTrackQueries(
  rows: number,
  columns: number,
  gapPx: number,
  paddingPx: number,
): Record<string, Record<string, number>> {
  return {
    ...createTrackAxisQueries(
      "min-width",
      "--grid-visible-columns",
      columns,
      GRID_MIN_CELL_WIDTH_PX,
      gapPx,
      paddingPx,
    ),
    ...createTrackAxisQueries(
      "min-height",
      "--grid-visible-rows",
      rows,
      GRID_MIN_CELL_HEIGHT_PX,
      gapPx,
      paddingPx,
    ),
  };
}

function createTrackAxisQueries(
  feature: "min-width" | "min-height",
  property: "--grid-visible-columns" | "--grid-visible-rows",
  count: number,
  minCellSizePx: number,
  gapPx: number,
  paddingPx: number,
): Record<string, Record<string, number>> {
  const queries: Record<string, Record<string, number>> = {};

  for (let visibleTracks = 2; visibleTracks <= count; visibleTracks++) {
    const thresholdPx = calculateTrackFitThresholdPx(
      visibleTracks,
      minCellSizePx,
      gapPx,
      paddingPx,
    );

    queries[`@container (${feature}: ${formatPx(thresholdPx)})`] = {
      [property]: visibleTracks,
    };
  }

  return queries;
}

function calculateTrackFitThresholdPx(
  count: number,
  minCellSizePx: number,
  gapPx: number,
  paddingPx: number,
): number {
  return count * minCellSizePx + (count - 1) * gapPx + 2 * paddingPx;
}

function createCellSizeExpression(
  viewportSize: string,
  visibleTracks: string,
  minCellSizePx: number,
): string {
  const availableSize = `${viewportSize} - 2 * ${GRID_PADDING} - (${visibleTracks} - 1) * ${GRID_GAP}`;

  return `max(${formatPx(minCellSizePx)}, calc((${availableSize}) / ${visibleTracks}))`;
}

function createGridExtentExpression(cellSize: string, count: number): string {
  return `calc(${count} * ${cellSize} + ${count - 1} * ${GRID_GAP} + 2 * ${GRID_PADDING})`;
}

function gapUnitsToPx(gap: number): number {
  return gap * GRID_GAP_UNIT_PX;
}

function formatPx(value: number): string {
  return `${value}px`;
}
