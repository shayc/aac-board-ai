import type { GridPosition } from "./grid-model";

const GRID_CELL_SELECTOR = "[role='gridcell']";
const GRID_FOCUSABLE_SELECTOR = "[tabindex]";

export function findGridPosition(
  target: EventTarget | null,
): GridPosition | null {
  if (!(target instanceof Element)) {
    return null;
  }

  const cell = target.closest(GRID_CELL_SELECTOR);
  if (!cell) {
    return null;
  }

  const row = Number.parseInt(cell.getAttribute("aria-rowindex") ?? "", 10) - 1;
  const column =
    Number.parseInt(cell.getAttribute("aria-colindex") ?? "", 10) - 1;
  if (Number.isNaN(row) || Number.isNaN(column)) {
    return null;
  }

  return { row, column };
}

export function findGridFocusableAt(
  root: HTMLElement,
  position: GridPosition,
): HTMLElement | null {
  return root.querySelector<HTMLElement>(
    `${GRID_CELL_SELECTOR}[aria-rowindex='${position.row + 1}'][aria-colindex='${position.column + 1}'] ${GRID_FOCUSABLE_SELECTOR}`,
  );
}
