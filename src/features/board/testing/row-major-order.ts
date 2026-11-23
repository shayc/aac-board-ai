import type { GridOrder } from "../grid/grid-cells";

export function rowMajorOrder(
  items: readonly { id: string }[],
  columns: number,
): GridOrder {
  const rows = Math.ceil(items.length / columns);

  return Array.from({ length: rows }, (_, row) =>
    Array.from(
      { length: columns },
      (_, column) => items[row * columns + column]?.id ?? null,
    ),
  );
}
