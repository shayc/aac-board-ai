export type GridOrder = readonly (readonly (string | null)[])[];

export interface GridPosition {
  row: number;
  column: number;
}

export function buildGrid<TItem extends { id: string }>(
  items: readonly TItem[],
  rows: number,
  columns: number,
  order?: GridOrder,
): (TItem | undefined)[][] {
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

export function findFirstOccupiedPosition(
  grid: readonly (readonly unknown[])[],
): GridPosition {
  for (const [row, cells] of grid.entries()) {
    const column = cells.findIndex(Boolean);
    if (column !== -1) {
      return { row, column };
    }
  }

  return { row: 0, column: 0 };
}

export function isSameGridPosition(
  first: GridPosition,
  second: GridPosition,
): boolean {
  return first.row === second.row && first.column === second.column;
}
