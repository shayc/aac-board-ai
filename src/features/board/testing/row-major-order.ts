import type { GridOrder } from "../grid/grid-model";

export function rowMajorOrder(
  items: readonly { id: string }[],
  rows: number,
  columns: number,
): GridOrder {
  return Array.from({ length: rows }, (_, row) =>
    Array.from(
      { length: columns },
      (_, column) => items[row * columns + column]?.id ?? null,
    ),
  );
}
