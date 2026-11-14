import type { Locator } from "vitest/browser";

interface CellIndices {
  row: string | null;
  column: string | null;
}

export function getCellIndices(item: Locator): CellIndices {
  const cell = item.element().closest("[role='gridcell']");
  if (!cell) {
    throw new Error("Item is not inside a grid cell");
  }

  return {
    row: cell.getAttribute("aria-rowindex"),
    column: cell.getAttribute("aria-colindex"),
  };
}
