import {
  type GridCells,
  type GridPosition,
  isSameGridPosition,
  listOccupiedPositions,
} from "./grid-model";

export type GridDirection = "ltr" | "rtl";

export interface GridKeyEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

interface GridStep {
  row: -1 | 0 | 1;
  column: -1 | 0 | 1;
}

export function findGridKeyTarget(
  grid: GridCells,
  from: GridPosition,
  event: GridKeyEvent,
  direction: GridDirection,
): GridPosition | null {
  if (event.key === "Home" || event.key === "End") {
    return findEdgeTarget(grid, from, event);
  }

  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return null;
  }

  const step = resolveArrowStep(event.key, direction);

  return step ? findArrowTarget(grid, from, step) : null;
}

function findEdgeTarget(
  grid: GridCells,
  from: GridPosition,
  event: GridKeyEvent,
): GridPosition | null {
  if (event.shiftKey || event.altKey) {
    return null;
  }

  const spansWholeGrid = event.ctrlKey || event.metaKey;
  const candidates = listOccupiedPositions(grid).filter(
    (position) => spansWholeGrid || position.row === from.row,
  );
  const goesToFirst = event.key === "Home";
  const target = goesToFirst ? candidates[0] : candidates.at(-1);
  if (!target || isSameGridPosition(target, from)) {
    return null;
  }

  return target;
}

function resolveArrowStep(
  key: string,
  direction: GridDirection,
): GridStep | null {
  const isRTL = direction === "rtl";

  switch (key) {
    case "ArrowUp":
      return { row: -1, column: 0 };
    case "ArrowDown":
      return { row: 1, column: 0 };
    case "ArrowLeft":
      return { row: 0, column: isRTL ? 1 : -1 };
    case "ArrowRight":
      return { row: 0, column: isRTL ? -1 : 1 };
    default:
      return null;
  }
}

function findArrowTarget(
  grid: GridCells,
  from: GridPosition,
  step: GridStep,
): GridPosition | null {
  const movesVertically = step.row !== 0;
  const stepDirection = movesVertically ? step.row : step.column;
  let best: {
    position: GridPosition;
    primaryDistance: number;
    crossDistance: number;
  } | null = null;

  for (const position of listOccupiedPositions(grid)) {
    const primaryDelta = movesVertically
      ? position.row - from.row
      : position.column - from.column;
    const crossDelta = movesVertically
      ? position.column - from.column
      : position.row - from.row;

    if (Math.sign(primaryDelta) !== stepDirection) {
      continue;
    }

    const primaryDistance = Math.abs(primaryDelta);
    const crossDistance = Math.abs(crossDelta);
    if (
      !best ||
      crossDistance < best.crossDistance ||
      (crossDistance === best.crossDistance &&
        primaryDistance < best.primaryDistance)
    ) {
      best = { position, primaryDistance, crossDistance };
    }
  }

  return best?.position ?? null;
}
