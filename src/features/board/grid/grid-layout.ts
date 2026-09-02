import type { Theme } from "@mui/material/styles";

const GRID_MIN_CELL_SIZE_PX = 96;
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
  scrollSnapAlign: "start",
} as const;

export const gridRowSx = {
  flex: 1,
  minHeight: GRID_CELL_HEIGHT,
  gap: GRID_GAP,
} as const;

export function createGridViewportSx(theme: Theme) {
  return {
    "--grid-padding": toPx(GRID_REGULAR_PADDING_PX),
    containerType: "size",
    height: "100%",
    overflow: "auto",
    scrollSnapType: "both proximity",
    scrollPadding: GRID_PADDING,
    [theme.breakpoints.down("sm")]: {
      "--grid-padding": toPx(GRID_COMPACT_PADDING_PX),
    },
  };
}

export function createGridContentSx(
  theme: Theme,
  { rows, columns, gap }: GridLayoutOptions,
) {
  const gapPx = gapToPx(gap);

  return {
    "--grid-visible-columns": 1,
    "--grid-visible-rows": 1,
    "--grid-gap": toPx(gapPx),
    "--grid-cell-width": createCellSizeExpression(
      "100cqi",
      "var(--grid-visible-columns)",
    ),
    "--grid-cell-height": createCellSizeExpression(
      "100cqb",
      "var(--grid-visible-rows)",
    ),
    minWidth: createGridExtentExpression(GRID_CELL_WIDTH, columns),
    minHeight: createGridExtentExpression(GRID_CELL_HEIGHT, rows),
    gap: GRID_GAP,
    p: GRID_PADDING,
    [theme.breakpoints.down("sm")]: visibleTrackQueries(
      rows,
      columns,
      gapPx,
      GRID_COMPACT_PADDING_PX,
    ),
    [theme.breakpoints.up("sm")]: visibleTrackQueries(
      rows,
      columns,
      gapPx,
      GRID_REGULAR_PADDING_PX,
    ),
  };
}

function visibleTrackQueries(
  rows: number,
  columns: number,
  gapPx: number,
  paddingPx: number,
): Record<string, Record<string, number>> {
  return {
    ...trackAxisQueries(
      "min-width",
      "--grid-visible-columns",
      columns,
      gapPx,
      paddingPx,
    ),
    ...trackAxisQueries(
      "min-height",
      "--grid-visible-rows",
      rows,
      gapPx,
      paddingPx,
    ),
  };
}

function trackAxisQueries(
  feature: "min-width" | "min-height",
  property: "--grid-visible-columns" | "--grid-visible-rows",
  count: number,
  gapPx: number,
  paddingPx: number,
): Record<string, Record<string, number>> {
  const queries: Record<string, Record<string, number>> = {};

  for (let visible = 2; visible <= count; visible++) {
    const thresholdPx = calculateTrackFitThresholdPx(visible, gapPx, paddingPx);

    queries[`@container (${feature}: ${toPx(thresholdPx)})`] = {
      [property]: visible,
    };
  }

  return queries;
}

function calculateTrackFitThresholdPx(
  count: number,
  gapPx: number,
  paddingPx: number,
): number {
  return count * GRID_MIN_CELL_SIZE_PX + (count - 1) * gapPx + 2 * paddingPx;
}

function createCellSizeExpression(
  viewportSize: string,
  visibleTracks: string,
): string {
  const availableSize = `${viewportSize} - 2 * ${GRID_PADDING} - (${visibleTracks} - 1) * ${GRID_GAP}`;

  return `max(${toPx(GRID_MIN_CELL_SIZE_PX)}, calc((${availableSize}) / ${visibleTracks}))`;
}

function createGridExtentExpression(cellSize: string, count: number): string {
  return `calc(${count} * ${cellSize} + ${count - 1} * ${GRID_GAP} + 2 * ${GRID_PADDING})`;
}

function gapToPx(gap: number): number {
  return gap * GRID_GAP_UNIT_PX;
}

function toPx(value: number): string {
  return `${value}px`;
}
