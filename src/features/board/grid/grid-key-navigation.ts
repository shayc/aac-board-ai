import { listGridFocusTargets, type GridFocusTarget } from "./grid-dom";
import type { GridPosition } from "./grid-model";

interface GridKeyEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

interface GridStep {
  row: -1 | 0 | 1;
  col: -1 | 0 | 1;
}

export function findGridKeyTarget(
  event: GridKeyEvent,
  root: HTMLElement,
  from: GridPosition,
  direction: "ltr" | "rtl",
): GridFocusTarget | null {
  if (event.key === "Home" || event.key === "End") {
    return findEdgeTarget(event, root, from, direction);
  }

  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return null;
  }

  const step = resolveArrowStep(event.key, direction);

  return step ? findNearestTarget(root, from, step) : null;
}

function findEdgeTarget(
  event: GridKeyEvent,
  root: HTMLElement,
  from: GridPosition,
  direction: "ltr" | "rtl",
): GridFocusTarget | null {
  if (event.shiftKey || event.altKey) {
    return null;
  }

  const spansWholeGrid = event.ctrlKey || event.metaKey;
  const candidates = listGridFocusTargets(
    root,
    spansWholeGrid ? undefined : from.row,
  );
  const goesToFirst =
    direction === "rtl" ? event.key === "End" : event.key === "Home";

  return (
    (goesToFirst ? candidates[0] : candidates[candidates.length - 1]) ?? null
  );
}

function resolveArrowStep(
  key: string,
  direction: "ltr" | "rtl",
): GridStep | null {
  const isRtl = direction === "rtl";

  switch (key) {
    case "ArrowUp":
      return { row: -1, col: 0 };
    case "ArrowDown":
      return { row: 1, col: 0 };
    case "ArrowLeft":
      return { row: 0, col: isRtl ? 1 : -1 };
    case "ArrowRight":
      return { row: 0, col: isRtl ? -1 : 1 };
    default:
      return null;
  }
}

function findNearestTarget(
  root: HTMLElement,
  from: GridPosition,
  step: GridStep,
): GridFocusTarget | null {
  let best: { target: GridFocusTarget; primary: number; cross: number } | null =
    null;

  for (const target of listGridFocusTargets(root)) {
    const { position } = target;
    const movesAlongRows = step.row !== 0;
    const primaryDelta = movesAlongRows
      ? position.row - from.row
      : position.col - from.col;
    const crossDelta = movesAlongRows
      ? position.col - from.col
      : position.row - from.row;
    const direction = movesAlongRows ? step.row : step.col;

    if (Math.sign(primaryDelta) !== direction) {
      continue;
    }

    const primary = Math.abs(primaryDelta);
    const cross = Math.abs(crossDelta);
    if (
      !best ||
      cross < best.cross ||
      (cross === best.cross && primary < best.primary)
    ) {
      best = { target, primary, cross };
    }
  }

  return best?.target ?? null;
}
