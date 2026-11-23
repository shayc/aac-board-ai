export type GridOrder = readonly (readonly (string | null)[])[];

export type GridCells<Item extends object = object> = readonly (readonly (
  | Item
  | undefined
)[])[];

export interface GridPosition {
  row: number;
  column: number;
}

export function buildGrid<Item extends { id: string }>(
  items: readonly Item[],
  order: GridOrder,
): (Item | undefined)[][] {
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return order.map((ids) =>
    ids.map((id) => (id ? itemsById.get(id) : undefined)),
  );
}

export function gridArrangementKey<Item extends object>(
  grid: GridCells<Item>,
  getItemKey: (item: Item) => string,
): string {
  return JSON.stringify(
    grid.map((row) => row.map((cell) => (cell ? getItemKey(cell) : null))),
  );
}

export function findFirstOccupiedPosition(grid: GridCells): GridPosition {
  return listOccupiedPositions(grid)[0] ?? { row: 0, column: 0 };
}

export function listOccupiedPositions(grid: GridCells): GridPosition[] {
  const positions: GridPosition[] = [];

  for (const [row, cells] of grid.entries()) {
    for (const [column, cell] of cells.entries()) {
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
