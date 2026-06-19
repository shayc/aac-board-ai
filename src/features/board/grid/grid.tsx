import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useGridKeyboard } from "./use-grid-keyboard";

const MIN_CELL_SIZE = "96px";
const PADDING = 2;
const MOBILE_COLUMNS = 3;

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
  gap = 2,
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
          "--cell-min-width": MIN_CELL_SIZE,
          [theme.breakpoints.down("sm")]: {
            "--cell-min-width": mobileCellWidth(theme, gap),
          },
          minHeight: "100%",
          minWidth: gridMinWidth(theme, columns, gap, "var(--cell-min-width)"),
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
                    minWidth: "var(--cell-min-width)",
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

function mobileCellWidth(theme: Theme, gap: number): string {
  return `calc((100cqi - ${theme.spacing(PADDING * 2)} - ${theme.spacing(gap * (MOBILE_COLUMNS - 1))}) / ${MOBILE_COLUMNS})`;
}

function gridMinWidth(
  theme: Theme,
  columns: number,
  gap: number,
  cellWidth: string,
): string {
  return `calc(${columns} * ${cellWidth} + ${columns - 1} * ${theme.spacing(gap)} + ${theme.spacing(PADDING * 2)})`;
}
