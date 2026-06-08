/** Minimum touch-target size for a board cell, in CSS pixels. */
export const MIN_CELL_PX = 72;

export type ScrollSnapType =
  | "none"
  | "x mandatory"
  | "y mandatory"
  | "both mandatory";

export interface SnapMetrics {
  /** Columns that fit in one screenful — spacing between horizontal snap points. */
  snapColumns: number;
  /** Rows that fit in one screenful — spacing between vertical snap points. */
  snapRows: number;
  /** Value for the scroll container's `scroll-snap-type`. */
  snapType: ScrollSnapType;
}

export interface SnapMetricsInput {
  /** Scroll container's visible width. */
  clientWidth: number;
  /** Scroll container's visible height. */
  clientHeight: number;
  /** Scroll container's total content width. */
  scrollWidth: number;
  /** Scroll container's total content height. */
  scrollHeight: number;
  /** Authored column count. */
  columns: number;
  /** Authored row count. */
  rows: number;
  /** Gap between cells, in CSS pixels. */
  gapPx: number;
}

/**
 * Pure geometry for scroll-snap windowing of a fixed-cell board.
 *
 * Computes how many whole {@link MIN_CELL_PX} cells fit per screenful (the snap
 * stride) and which axes actually overflow (so a fitting axis never snaps). No
 * DOM or React — measurement is the caller's job, which keeps this testable.
 */
export function computeSnapMetrics({
  clientWidth,
  clientHeight,
  scrollWidth,
  scrollHeight,
  columns,
  rows,
  gapPx,
}: SnapMetricsInput): SnapMetrics {
  const pitch = MIN_CELL_PX + gapPx; // cell + gap

  // N cells span N*MIN + (N-1)*gap, so N <= (extent + gap) / pitch.
  const fitCols = Math.floor((clientWidth + gapPx) / pitch);
  const fitRows = Math.floor((clientHeight + gapPx) / pitch);

  const snapColumns = Math.max(1, Math.min(columns, fitCols));
  const snapRows = Math.max(1, Math.min(rows, fitRows));

  const overflowsX = scrollWidth - clientWidth > 1;
  const overflowsY = scrollHeight - clientHeight > 1;

  const snapType: ScrollSnapType =
    overflowsX && overflowsY
      ? "both mandatory"
      : overflowsX
        ? "x mandatory"
        : overflowsY
          ? "y mandatory"
          : "none";

  return { snapColumns, snapRows, snapType };
}
