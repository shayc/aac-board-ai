import type { Locator } from "vitest/browser";
import type { GridPosition } from "../grid/grid-model";

export function getCellPosition(item: Locator): GridPosition {
  const cell = item.element().closest("[role='gridcell']");

  if (!cell) {
    throw new Error("Item is not inside a grid cell");
  }

  const row = parseInt(cell.getAttribute("aria-rowindex") ?? "", 10) - 1;
  const column = parseInt(cell.getAttribute("aria-colindex") ?? "", 10) - 1;

  if (isNaN(row) || isNaN(column)) {
    throw new Error("Grid cell missing valid aria-rowindex or aria-colindex");
  }

  return { row, column };
}
