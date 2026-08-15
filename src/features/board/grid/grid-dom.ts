import type { GridPosition } from "./grid-model";

const GRID_CELL_SELECTOR = "[role='gridcell']";
const GRID_FOCUS_TARGET_SELECTOR = "[tabindex]";

export interface GridFocusTarget {
  element: HTMLElement;
  position: GridPosition;
}

export function findGridPosition(target: Element | null): GridPosition | null {
  return readGridPosition(target?.closest(GRID_CELL_SELECTOR) ?? null);
}

export function findFocusableInGridPosition(
  root: HTMLElement,
  position: GridPosition,
): HTMLElement | null {
  return root.querySelector<HTMLElement>(
    `${GRID_CELL_SELECTOR}[aria-rowindex='${position.row + 1}'][aria-colindex='${position.col + 1}'] ${GRID_FOCUS_TARGET_SELECTOR}`,
  );
}

export function findFirstGridFocusable(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>(
    `${GRID_CELL_SELECTOR} ${GRID_FOCUS_TARGET_SELECTOR}`,
  );
}

export function listGridFocusTargets(
  root: HTMLElement,
  row?: number,
): GridFocusTarget[] {
  const targets: GridFocusTarget[] = [];

  for (const cell of root.querySelectorAll<HTMLElement>(GRID_CELL_SELECTOR)) {
    const position = readGridPosition(cell);
    if (!position || (row !== undefined && position.row !== row)) {
      continue;
    }

    for (const element of cell.querySelectorAll<HTMLElement>(
      GRID_FOCUS_TARGET_SELECTOR,
    )) {
      targets.push({ element, position });
    }
  }

  return targets;
}

export function isSameGridPosition(
  first: GridPosition,
  second: GridPosition,
): boolean {
  return first.row === second.row && first.col === second.col;
}

function readGridPosition(cell: Element | null): GridPosition | null {
  if (!cell) {
    return null;
  }

  const row = Number.parseInt(cell.getAttribute("aria-rowindex") ?? "", 10) - 1;
  const col = Number.parseInt(cell.getAttribute("aria-colindex") ?? "", 10) - 1;
  if (Number.isNaN(row) || Number.isNaN(col)) {
    return null;
  }

  return { row, col };
}
