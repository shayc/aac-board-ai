export type GridOrder = readonly (readonly (string | null)[])[];

export interface GridPosition {
  row: number;
  col: number;
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
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col]) {
        return { row, col };
      }
    }
  }

  return { row: 0, col: 0 };
}
