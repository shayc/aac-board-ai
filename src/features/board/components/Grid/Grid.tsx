import { useGridKeyboard } from "@features/board/hooks/useGridKeyboard";
import Stack from "@mui/material/Stack";
import { useRef } from "react";

export interface GridItemProps {
  ref: (el: HTMLElement | null) => void;
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

  const refCallbacks: Record<string, (el: HTMLElement | null) => void> = {};

  for (let rowIndex = 0; rowIndex < rows; rowIndex++) {
    for (let cellIndex = 0; cellIndex < columns; cellIndex++) {
      const key = `${rowIndex}-${cellIndex}`;
      refCallbacks[key] = ((r: number, c: number) => {
        return (el: HTMLElement | null) => {
          if (!cellRefs.current[r]) {
            cellRefs.current[r] = [];
          }
          cellRefs.current[r][c] = el;
        };
      })(rowIndex, cellIndex);
    }
  }

  const { keyboardProps, activeCell, handleFocus } = useGridKeyboard({
    cellRefs,
    rows,
    columns,
  });

  return (
    <Stack
      {...keyboardProps}
      onFocus={handleFocus}
      height="100%"
      direction="column"
      flexGrow={1}
      padding={gap}
      gap={gap}
    >
      {grid.map((row, rowIndex) => (
        <Stack key={rowIndex} direction="row" flexGrow={1} gap={gap}>
          {row.map((item, cellIndex) => {
            const isActive =
              rowIndex === activeCell.row && cellIndex === activeCell.col;
            return (
              <Stack
                key={cellIndex}
                data-grid-cell="true"
                data-row={rowIndex}
                data-col={cellIndex}
                flex={1}
                sx={{ minWidth: 64, minHeight: 64 }}
              >
                {item &&
                  renderItem(item, {
                    ref: refCallbacks[`${rowIndex}-${cellIndex}`],
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
