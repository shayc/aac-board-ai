import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { ReactNode, Ref } from "react";
import {
  createGridContentSx,
  createGridViewportSx,
  gridCellSx,
  gridRowSx,
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
        sx={(theme) => createGridContentSx(theme, { rows, columns, gap })}
      >
        {grid.map((row, rowIndex) => (
          <GridRow
            key={rowIndex}
            items={row}
            rowIndex={rowIndex}
            activeColumn={
              rowIndex === activeCell.row ? activeCell.col : undefined
            }
            renderItem={renderItem}
          />
        ))}
      </Stack>
    </Box>
  );
}

interface GridRowProps<TItem extends { id: string }> {
  items: readonly (TItem | undefined)[];
  rowIndex: number;
  activeColumn: number | undefined;
  renderItem: (item: TItem, props: GridItemProps) => ReactNode;
}

function GridRow<TItem extends { id: string }>({
  items,
  rowIndex,
  activeColumn,
  renderItem,
}: GridRowProps<TItem>) {
  return (
    <Stack role="row" direction="row" sx={gridRowSx}>
      {items.map((item, columnIndex) => (
        <Stack
          key={columnIndex}
          role="gridcell"
          aria-rowindex={rowIndex + 1}
          aria-colindex={columnIndex + 1}
          sx={gridCellSx}
        >
          {item &&
            renderItem(item, {
              tabIndex: columnIndex === activeColumn ? 0 : -1,
            })}
        </Stack>
      ))}
    </Stack>
  );
}
