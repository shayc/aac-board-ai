import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { ReactNode, Ref } from "react";
import {
  createGridContentSx,
  createGridRowSx,
  createGridViewportSx,
  gridCellSx,
} from "./grid-layout";
import { buildGrid, type GridOrder } from "./grid-model";
import { useGridKeyboard } from "./use-grid-keyboard";

export interface GridItemProps {
  tabIndex: number;
}

interface GridProps<TItem extends { id: string }> {
  ariaLabel?: string;
  items: readonly TItem[];
  rows: number;
  columns: number;
  order?: GridOrder;
  renderItem: (item: TItem, props: GridItemProps) => ReactNode;
  dir?: "ltr" | "rtl";
  gap?: number;
  ref?: Ref<HTMLDivElement>;
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
  ref,
}: GridProps<TItem>) {
  const grid = buildGrid(items, rows, columns, order);
  const { rootRef, rootProps, activeCell } = useGridKeyboard({
    grid,
    dir,
  });

  return (
    <Box ref={ref} dir={dir} sx={createGridViewportSx}>
      <Stack
        {...rootProps}
        ref={rootRef}
        role="grid"
        aria-label={ariaLabel}
        direction="column"
        sx={(theme) => createGridContentSx(theme, rows, columns, gap)}
      >
        {grid.map((row, rowIndex) => {
          const cells = row.map((item, colIndex) => {
            const isActive =
              rowIndex === activeCell.row && colIndex === activeCell.col;

            return (
              <Stack
                key={colIndex}
                role="gridcell"
                aria-rowindex={rowIndex + 1}
                aria-colindex={colIndex + 1}
                sx={gridCellSx}
              >
                {item &&
                  renderItem(item, {
                    tabIndex: isActive ? 0 : -1,
                  })}
              </Stack>
            );
          });

          return (
            <Stack
              key={rowIndex}
              role="row"
              direction="row"
              sx={createGridRowSx(gap)}
            >
              {cells}
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
