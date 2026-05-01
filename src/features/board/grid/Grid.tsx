import Stack from "@mui/material/Stack";
import { useRef } from "react";
import { useGridKeyboard } from "./useGridKeyboard";

export interface GridItemProps {
  tabIndex: number;
}

export interface GridProps<TItem extends { id: string }> {
  rows: number;
  columns: number;
  gap?: number;
  order?: (string | null)[][];
  items: TItem[];
  renderItem: (item: TItem, props: GridItemProps) => React.ReactNode;
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
  const gridRef = useRef<HTMLDivElement>(null);
  const defaultActiveCell = findFirstNonEmptyCell(grid);

  const { keyboardProps, activeCell, handleFocus } = useGridKeyboard({
    gridRef,
    rows,
    columns,
    defaultActiveCell,
  });

  return (
    <Stack
      {...keyboardProps}
      ref={gridRef}
      onFocus={handleFocus}
      role="grid"
      aria-rowcount={rows}
      aria-colcount={columns}
      direction="column"
      sx={{ minHeight: "100%", p: 2, gap }}
    >
      {grid.map((row, rowIndex) => (
        <Stack
          key={rowIndex}
          role="row"
          direction="row"
          sx={{ flexGrow: 1, gap }}
        >
          {row.map((item, colIndex) => {
            const isActive =
              rowIndex === activeCell.row && colIndex === activeCell.col;

            return (
              <Stack
                key={colIndex}
                role="gridcell"
                aria-rowindex={rowIndex + 1}
                aria-colindex={colIndex + 1}
                sx={{ flex: 1, minWidth: 80, minHeight: 80 }}
              >
                {item &&
                  renderItem(item, {
                    tabIndex: isActive ? 0 : -1,
                  })}
              </Stack>
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
}

function buildGrid<T extends { id: string }>(
  items: readonly T[],
  rows: number,
  columns: number,
  order?: (string | null)[][],
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
    }),
  );
}

function findFirstNonEmptyCell<T>(grid: (T | undefined)[][]): {
  row: number;
  col: number;
} {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      if (grid[row][col]) {
        return { row, col };
      }
    }
  }
  return { row: 0, col: 0 };
}
