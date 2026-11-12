import {
  findGridPosition,
  type GridFocusTarget,
  listGridFocusTargets,
} from "./grid-dom";
import { type GridPosition, isSameGridPosition } from "./grid-model";

interface GridKeyEvent {
  key: string;
  target: EventTarget | null;
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
  event: GridKeyEvent,
  root: HTMLElement,
): GridFocusTarget | null {
  const from = findGridPosition(event.target);
  if (!from) {
    return null;
  }

  if (event.key === "Home" || event.key === "End") {
    return findEdgeTarget(event, root, from);
  }

  if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
    return null;
  }

  const direction = root.matches(":dir(rtl)") ? "rtl" : "ltr";
  const step = resolveArrowStep(event.key, direction);

  return step ? findArrowTarget(root, from, step) : null;
}

function findEdgeTarget(
  event: GridKeyEvent,
  root: HTMLElement,
  from: GridPosition,
): GridFocusTarget | null {
  if (event.shiftKey || event.altKey) {
    return null;
  }

  const spansWholeGrid = event.ctrlKey || event.metaKey;
  const candidates = listGridFocusTargets(
    root,
    spansWholeGrid ? undefined : from.row,
  );
  const goesToFirst = event.key === "Home";
  const target = goesToFirst ? candidates[0] : candidates.at(-1);
  if (!target || isSameGridPosition(target.position, from)) {
    return null;
  }

  return target;
}

function resolveArrowStep(
  key: string,
  direction: "ltr" | "rtl",
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
  root: HTMLElement,
  from: GridPosition,
  step: GridStep,
): GridFocusTarget | null {
  const movesVertically = step.row !== 0;
  const stepDirection = movesVertically ? step.row : step.column;
  let best: {
    target: GridFocusTarget;
    primaryDistance: number;
    crossDistance: number;
  } | null = null;

  for (const target of listGridFocusTargets(root)) {
    const { position } = target;
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
      best = { target, primaryDistance, crossDistance };
    }
  }

  return best?.target ?? null;
}
