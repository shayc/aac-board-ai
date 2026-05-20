import Stack from "@mui/material/Stack";
import { useEffect, useRef } from "react";
import { useGridKeyboardNavigation } from "./use-grid-keyboard-navigation";

export interface GridItemProps {
  tabIndex: number;
}

export interface GridProps<TItem extends { id: string }> {
  items: TItem[];
  rows: number;
  columns: number;
  order?: (string | null)[][];
  renderItem: (item: TItem, props: GridItemProps) => React.ReactNode;
  dir?: "ltr" | "rtl";
  gap?: number;
}

export function Grid<TItem extends { id: string }>({
  items,
  rows,
  columns,
  order,
  renderItem,
  dir = "ltr",
  gap = 2,
}: GridProps<TItem>) {
  const grid = buildGrid(items, rows, columns, order);
  const gridRef = useRef<HTMLDivElement>(null);
  const previousItemsRef = useRef(items);
  const initialActiveCell = findFirstNonEmptyCell(grid);

  const { rootProps, activeCell } = useGridKeyboardNavigation({
    gridRef,
    initialActiveCell,
    dir,
  });

  const activeCellRef = useRef(activeCell);
  useEffect(() => {
    activeCellRef.current = activeCell;
  });

  useEffect(() => {
    if (previousItemsRef.current === items) {
      return;
    }
    previousItemsRef.current = items;

    // Board navigation unmounts the focused cell; the browser drops focus to <body>.
    // Restore to the same row/col, or fall back to the first focusable cell.
    if (document.activeElement !== document.body) {
      return;
    }

    const root = gridRef.current;
    if (!root) {
      return;
    }

    const { row, col } = activeCellRef.current;
    const sameCell = root.querySelector<HTMLElement>(
      `[role='gridcell'][aria-rowindex='${row + 1}'][aria-colindex='${col + 1}'] [tabindex]`,
    );

    if (sameCell) {
      sameCell.focus();
      return;
    }

    const firstFocusable = root.querySelector<HTMLElement>(
      "[role='gridcell'] [tabindex]",
    );
    firstFocusable?.focus();
  }, [items]);

  return (
    <Stack
      {...rootProps}
      ref={gridRef}
      role="grid"
      aria-rowcount={rows}
      aria-colcount={columns}
      direction="column"
      dir={dir}
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
