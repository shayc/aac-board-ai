import type { Theme } from "@mui/material/styles";

const MUI_SPACING_UNIT_PX = 8;
const MIN_CELL_SIZE_PX = 96;
const PAD = "var(--pad)";
const TOTAL_PADDING = `calc(2 * ${PAD})`;
const SMALL_SCREEN_PADDING = 2;
const DEFAULT_PADDING = 3;

export const gridCellSx = {
  flex: 1,
  minWidth: "var(--cell-width)",
  minHeight: `${MIN_CELL_SIZE_PX}px`,
  scrollSnapAlign: "start",
} as const;

export function createGridViewportSx(theme: Theme) {
  return {
    "--pad": theme.spacing(DEFAULT_PADDING),
    containerType: "size",
    height: "100%",
    overflow: "auto",
    scrollSnapType: "both proximity",
    scrollPadding: PAD,
    [theme.breakpoints.down("sm")]: {
      "--pad": theme.spacing(SMALL_SCREEN_PADDING),
    },
  };
}

export function createGridContentSx(
  theme: Theme,
  rows: number,
  columns: number,
  gap: number,
) {
  return {
    "--visible-cols": 1,
    "--visible-rows": 1,
    "--cell-width": trackSize(theme, "100cqi", gap, "var(--visible-cols)"),
    "--cell-height": trackSize(theme, "100cqb", gap, "var(--visible-rows)"),
    minWidth: gridExtent(theme, "var(--cell-width)", gap, columns),
    minHeight: gridExtent(theme, "var(--cell-height)", gap, rows),
    gap,
    p: PAD,
    [theme.breakpoints.down("sm")]: visibleTrackQueries(
      rows,
      columns,
      gap,
      SMALL_SCREEN_PADDING,
    ),
    [theme.breakpoints.up("sm")]: visibleTrackQueries(
      rows,
      columns,
      gap,
      DEFAULT_PADDING,
    ),
  };
}

export function createGridRowSx(gap: number) {
  return { flex: 1, minHeight: "var(--cell-height)", gap };
}

function visibleTrackQueries(
  rows: number,
  columns: number,
  gap: number,
  padding: number,
): Record<string, Record<string, number>> {
  return {
    ...trackAxisQueries("min-width", "--visible-cols", columns, gap, padding),
    ...trackAxisQueries("min-height", "--visible-rows", rows, gap, padding),
  };
}

function trackAxisQueries(
  feature: "min-width" | "min-height",
  property: "--visible-cols" | "--visible-rows",
  count: number,
  gap: number,
  padding: number,
): Record<string, Record<string, number>> {
  const queries: Record<string, Record<string, number>> = {};

  for (let visible = 2; visible <= count; visible++) {
    const threshold = trackFitThreshold(visible, gap, padding);

    queries[`@container (${feature}: ${threshold})`] = {
      [property]: visible,
    };
  }

  return queries;
}

function trackFitThreshold(
  count: number,
  gap: number,
  padding: number,
): string {
  const threshold =
    count * MIN_CELL_SIZE_PX +
    (count - 1) * gap * MUI_SPACING_UNIT_PX +
    2 * padding * MUI_SPACING_UNIT_PX;

  return `${threshold}px`;
}

function trackSize(
  theme: Theme,
  extent: string,
  gap: number,
  visible: string,
): string {
  return `calc((${extent} - ${TOTAL_PADDING} - (${visible} - 1) * ${theme.spacing(gap)}) / ${visible})`;
}

function gridExtent(
  theme: Theme,
  cellSize: string,
  gap: number,
  count: number,
): string {
  return `calc(${count} * ${cellSize} + ${count - 1} * ${theme.spacing(gap)} + ${TOTAL_PADDING})`;
}
