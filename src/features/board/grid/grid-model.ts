export type GridOrder = readonly (readonly (string | null)[])[];

export type GridCells = readonly (readonly ({ id: string } | undefined)[])[];

export interface GridPosition {
  row: number;
  column: number;
}

export function buildGrid<Item extends { id: string }>(
  items: readonly Item[],
  rows: number,
  columns: number,
  order?: GridOrder,
): (Item | undefined)[][] {
  if (order?.length) {
    const itemsById = new Map(items.map((item) => [item.id, item]));

    return Array.from({ length: rows }, (_, rowIndex) => {
      const orderRow = order[rowIndex] ?? [];

      return Array.from({ length: columns }, (_, columnIndex) => {
        const id = orderRow[columnIndex];

        return id ? itemsById.get(id) : undefined;
      });
    });
  }

  return Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, columnIndex) => {
      const index = rowIndex * columns + columnIndex;

      return items[index];
    }),
  );
}

export function gridArrangementKey(grid: GridCells): string {
  return JSON.stringify(grid.map((row) => row.map((cell) => cell?.id ?? null)));
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
