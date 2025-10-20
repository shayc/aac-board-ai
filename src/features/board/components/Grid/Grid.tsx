import Stack from "@mui/material/Stack";

export interface GridProps<TItem extends { id: string }> {
  rows: number;
  columns: number;
  gap?: number;
  order?: (string | null)[][];
  items: TItem[];
  renderItem: (item: TItem) => React.ReactNode;
}

export function Grid<TItem extends { id: string }>({
  rows,
  columns,
  items,
  order,
  gap = 2,
  renderItem,
}: GridProps<TItem>) {
  const grid = buildGrid(items, rows, columns, order);

  return (
    <Stack
      height="100%"
      direction="column"
      flexGrow={1}
      padding={gap}
      gap={gap}
    >
      {grid.map((row, rowIndex) => (
        <Stack key={rowIndex} direction="row" flexGrow={1} gap={gap}>
          {row.map((item, cellIndex) => (
            <Stack key={cellIndex} flex={1} sx={{ minWidth: 64, minHeight: 64 }}>
              {item && renderItem(item)}
            </Stack>
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

function buildGrid<T extends { id: string }>(
  items: readonly T[],
  rows: number,
  columns: number,
  order?: (string | null)[][]
): (T | undefined)[][] {
  if (order?.length) {
    const itemsById = new Map(items.map((item) => [item.id, item]));

    return Array.from({ length: rows }, (_, r) => {
      const orderRow = order[r] ?? [];

      return Array.from({ length: columns }, (_, c) => {
        const id = orderRow[c] ?? undefined;
        return id ? itemsById.get(id) : undefined;
      });
    });
  }

  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: columns }, (_, c) => {
      const index = r * columns + c;
      return items[index];
    })
  );
}
