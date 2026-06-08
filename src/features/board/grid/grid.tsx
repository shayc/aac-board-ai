import Stack from "@mui/material/Stack";
import { MIN_CELL_PX } from "./grid-metrics";
import { useGridKeyboard } from "./use-grid-keyboard";

export interface GridItemProps {
  tabIndex: number;
}

export interface GridProps<TItem extends { id: string }> {
  ariaLabel?: string;
  items: readonly TItem[];
  rows: number;
  columns: number;
  order?: (string | null)[][];
  renderItem: (item: TItem, props: GridItemProps) => React.ReactNode;
  dir?: "ltr" | "rtl";
  gap?: number;
}

export function Grid<TItem extends { id: string }>({
  ariaLabel,
  items,
  rows,
  columns,
  order,
  renderItem,
  dir = "ltr",
  gap = 2,
}: GridProps<TItem>) {
  const grid = buildGrid(items, rows, columns, order);
  const { rootRef, rootProps, activeCell } = useGridKeyboard({
    grid,
    dir,
  });

  return (
    <Stack
      {...rootProps}
      ref={rootRef}
      role="grid"
      aria-label={ariaLabel}
      aria-rowcount={rows}
      aria-colcount={columns}
      direction="column"
      dir={dir}
      sx={(theme) => ({
        minHeight: "100%",
        minWidth: `calc(${columns} * ${MIN_CELL_PX}px + ${columns - 1} * ${theme.spacing(gap)} + ${theme.spacing(gap * 2)})`,
        p: gap,
        gap,
      })}
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
                sx={{ flex: 1, minWidth: MIN_CELL_PX, minHeight: MIN_CELL_PX }}
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

function buildGrid<TItem extends { id: string }>(
  items: readonly TItem[],
  rows: number,
  columns: number,
  order?: (string | null)[][],
): (TItem | undefined)[][] {
  if (order?.length) {
    const itemsById = new Map(items.map((item) => [item.id, item]));

    return Array.from({ length: rows }, (_, r) => {
      const orderRow = order[r] ?? [];

      return Array.from({ length: columns }, (_, c) => {
        const id = orderRow[c];

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
