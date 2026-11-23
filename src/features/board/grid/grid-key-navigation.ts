import {
  type GridCells,
  type GridPosition,
  isSameGridPosition,
  listOccupiedPositions,
} from "./grid-cells";

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
  const primaryAxis = step.row !== 0 ? "row" : "column";
  const crossAxis = primaryAxis === "row" ? "column" : "row";
  let best: {
    position: GridPosition;
    primaryDistance: number;
    crossDistance: number;
  } | null = null;

  for (const position of listOccupiedPositions(grid)) {
    const primaryDelta = position[primaryAxis] - from[primaryAxis];
    if (Math.sign(primaryDelta) !== step[primaryAxis]) {
      continue;
    }

    const primaryDistance = Math.abs(primaryDelta);
    const crossDistance = Math.abs(position[crossAxis] - from[crossAxis]);
    const isNearer =
      !best ||
      crossDistance < best.crossDistance ||
      (crossDistance === best.crossDistance &&
        primaryDistance < best.primaryDistance);
    if (isNearer) {
      best = { position, primaryDistance, crossDistance };
    }
  }

  return best?.position ?? null;
}
