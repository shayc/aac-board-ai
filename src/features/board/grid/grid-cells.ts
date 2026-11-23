export type GridOrder = readonly (readonly (string | null)[])[];

export type GridCells<Item extends object = object> = readonly (readonly (
  | Item
  | undefined
)[])[];

export interface GridPosition {
  row: number;
  column: number;
}

export function buildGridCells<Item extends { id: string }>(
  items: readonly Item[],
  order: GridOrder,
): (Item | undefined)[][] {
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return order.map((ids) =>
    ids.map((id) => (id ? itemsById.get(id) : undefined)),
  );
}

export function gridCellsKey<Item extends object>(
  cells: GridCells<Item>,
  getItemKey: (item: Item) => string,
): string {
  return JSON.stringify(
    cells.map((row) => row.map((cell) => (cell ? getItemKey(cell) : null))),
  );
}

export function findFirstOccupiedPosition(cells: GridCells): GridPosition {
  return listOccupiedPositions(cells)[0] ?? { row: 0, column: 0 };
}

export function listOccupiedPositions(cells: GridCells): GridPosition[] {
  const positions: GridPosition[] = [];

  for (const [row, rowCells] of cells.entries()) {
    for (const [column, cell] of rowCells.entries()) {
      if (cell) {
        positions.push({ row, column });
      }
    }
  }

  return positions;
}

export function isSameGridPosition(
  first: GridPosition,
  second: GridPosition,
): boolean {
  return first.row === second.row && first.column === second.column;
}
