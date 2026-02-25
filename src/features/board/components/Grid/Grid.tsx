import { useGridKeyboard } from "@features/board/hooks/useGridKeyboard";
import Stack from "@mui/material/Stack";
import { useRef } from "react";

type RefCallback = (element: HTMLElement | null) => void;

export interface GridItemProps {
  ref: RefCallback;
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
  const cellRefs = useRef<(HTMLElement | null)[][]>([]);
  const defaultActiveCell = findFirstNonEmptyCell(grid);

  const refCallbacks: Record<string, RefCallback> = {};

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let colIndex = 0; colIndex < columns; colIndex++) {
      refCallbacks[`${rowIndex}-${colIndex}`] = (element) => {
        if (!cellRefs.current[rowIndex]) {
          cellRefs.current[rowIndex] = [];
        }
        cellRefs.current[rowIndex][colIndex] = element;
      };
    }
  }

  const { keyboardProps, activeCell, handleFocus } = useGridKeyboard({
    cellRefs,
    rows,
    columns,
    defaultActiveCell,
  });

  return (
    <Stack
      {...keyboardProps}
      onFocus={handleFocus}
      role="grid"
      aria-rowcount={rows}
      aria-colcount={columns}
      minHeight="100%"
      direction="column"
      p={2}
      gap={gap}
    >
      {grid.map((row, rowIndex) => (
        <Stack key={rowIndex} role="row" direction="row" flexGrow={1} gap={gap}>
          {row.map((item, colIndex) => {
            const isActive =
              rowIndex === activeCell.row && colIndex === activeCell.col;

            return (
              <Stack
                key={colIndex}
                role="gridcell"
                aria-rowindex={rowIndex + 1}
                aria-colindex={colIndex + 1}
                flex={1}
                sx={{ minWidth: 80, minHeight: 80 }}
              >
                {item &&
                  renderItem(item, {
                    ref: refCallbacks[`${rowIndex}-${colIndex}`],
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

    return Array.from({ length: rows }, (_, row) => {
      const orderRow = order[row] ?? [];

      return Array.from({ length: columns }, (_, col) => {
        const id = orderRow[col];
        return id ? itemsById.get(id) : undefined;
      });
    });
  }

  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, col) => {
      const index = row * columns + col;
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
