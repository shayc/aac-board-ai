import type { Locator } from "vitest/browser";
import { render, type RenderResult } from "vitest-browser-react";
import { Grid, type GridItemProps } from "../grid/grid";
import type { GridOrder, GridPosition } from "../grid/grid-model";

export interface GridTestItem {
  id: string;
  label: string;
}

interface GridElementOptions {
  rows: number;
  columns: number;
  items: readonly GridTestItem[];
  order?: GridOrder;
  ariaLabel?: string;
  dir?: "ltr" | "rtl";
}

export function makeGridItems(...ids: number[]): GridTestItem[] {
  return ids.map((id) => ({ id: String(id), label: `Item ${id}` }));
}

export function renderGridButton(item: GridTestItem, props: GridItemProps) {
  return (
    <button key={item.id} {...props}>
      {item.label}
    </button>
  );
}

export function gridElement({ dir, ...gridProps }: GridElementOptions) {
  return (
    <div dir={dir}>
      <Grid {...gridProps} renderItem={renderGridButton} />
    </div>
  );
}

export function renderGrid(options: GridElementOptions) {
  return render(gridElement(options));
}

export function getGridItem(screen: RenderResult, id: number): Locator {
  return screen.getByRole("button", { name: `Item ${id}`, exact: true });
}

export function getCellPosition(item: Locator): GridPosition {
  const cell = item.element().closest("[role='gridcell']");

  if (!cell) {
    throw new Error("Item is not inside a grid cell");
  }

  const row = Number.parseInt(cell.getAttribute("aria-rowindex") ?? "", 10) - 1;
  const column =
    Number.parseInt(cell.getAttribute("aria-colindex") ?? "", 10) - 1;

  if (Number.isNaN(row) || Number.isNaN(column)) {
    throw new Error("Grid cell missing valid aria-rowindex or aria-colindex");
  }

  return { row, column };
}
