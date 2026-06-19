import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useGridKeyboard } from "./use-grid-keyboard";

const MIN_CELL_SIZE = "96px";
const PADDING = 2;

type GridOrder = readonly (readonly (string | null)[])[];

export interface GridItemProps {
  tabIndex: number;
}

export interface GridProps<TItem extends { id: string }> {
  ariaLabel?: string;
  items: readonly TItem[];
  rows: number;
  columns: number;
  order?: GridOrder;
  renderItem: (item: TItem, props: GridItemProps) => ReactNode;
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
  gap = 1,
}: GridProps<TItem>) {
  const grid = buildGrid(items, rows, columns, order);
  const { rootRef, rootProps, activeCell } = useGridKeyboard({
    grid,
    dir,
  });

  return (
    <Box
      dir={dir}
      sx={{
        height: "100%",
        overflow: "auto",
        containerType: "inline-size",
      }}
    >
      <Stack
        {...rootProps}
        ref={rootRef}
        role="grid"
        aria-label={ariaLabel}
        direction="column"
        sx={(theme) => ({
          "--visible-cols": visibleColumns(theme, columns, gap),
          "--cell-width": `calc((100cqi - ${theme.spacing(PADDING * 2)} - (var(--visible-cols) - 1) * ${theme.spacing(gap)}) / var(--visible-cols))`,
          minHeight: "100%",
          minWidth: gridMinWidth(theme, columns, gap, "var(--cell-width)"),
          p: PADDING,
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
                  sx={{
                    flex: 1,
                    minWidth: "var(--cell-width)",
                    minHeight: MIN_CELL_SIZE,
                  }}
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
    </Box>
  );
}

function buildGrid<TItem extends { id: string }>(
  items: readonly TItem[],
  rows: number,
  columns: number,
  order?: GridOrder,
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

function visibleColumns(theme: Theme, columns: number, gap: number): string {
  const inner = `100cqi - ${theme.spacing(PADDING * 2)}`;
  const pitch = `${MIN_CELL_SIZE} + ${theme.spacing(gap)}`;

  return `min(${columns}, max(1, round(down, (${inner} + ${theme.spacing(gap)}) / (${pitch}), 1)))`;
}

function gridMinWidth(
  theme: Theme,
  columns: number,
  gap: number,
  cellWidth: string,
): string {
  return `calc(${columns} * ${cellWidth} + ${columns - 1} * ${theme.spacing(gap)} + ${theme.spacing(PADDING * 2)})`;
}
