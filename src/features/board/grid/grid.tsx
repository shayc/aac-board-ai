import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";
import {
  createGridContentSx,
  createGridViewportSx,
  gridCellSx,
  gridRowSx,
} from "./grid-layout";
import { buildGrid, type GridOrder } from "./grid-model";
import { useGridFocus } from "./use-grid-focus";

export interface GridItemProps {
  tabIndex: number;
}

type GridRowDataAttributes = Record<`data-${string}`, string>;

interface GridProps<TItem extends { id: string }> {
  "aria-label"?: string;
  items: readonly TItem[];
  rows: number;
  columns: number;
  order?: GridOrder;
  renderItem: (item: TItem, props: GridItemProps) => ReactNode;
  rowProps?: GridRowDataAttributes;
  gap?: number;
}

export function Grid<TItem extends { id: string }>({
  "aria-label": ariaLabel,
  items,
  rows,
  columns,
  order,
  renderItem,
  rowProps,
  gap = 1,
}: GridProps<TItem>) {
  const grid = buildGrid(items, rows, columns, order);
  const { rootRef, rootProps, tabStopPosition } = useGridFocus(grid);

  return (
    <Box sx={(theme) => createGridViewportSx(theme, gap)}>
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
            tabStopColumn={
              rowIndex === tabStopPosition.row
                ? tabStopPosition.column
                : undefined
            }
            renderItem={renderItem}
            rowProps={rowProps}
          />
        ))}
      </Stack>
    </Box>
  );
}

interface GridRowProps<TItem extends { id: string }> {
  items: readonly (TItem | undefined)[];
  rowIndex: number;
  tabStopColumn: number | undefined;
  renderItem: (item: TItem, props: GridItemProps) => ReactNode;
  rowProps: GridRowDataAttributes | undefined;
}

function GridRow<TItem extends { id: string }>({
  items,
  rowIndex,
  tabStopColumn,
  renderItem,
  rowProps,
}: GridRowProps<TItem>) {
  return (
    <Stack {...rowProps} role="row" direction="row" sx={gridRowSx}>
      {items.map((item, columnIndex) => (
        <GridCell
          key={columnIndex}
          item={item}
          rowIndex={rowIndex}
          columnIndex={columnIndex}
          isTabStop={columnIndex === tabStopColumn}
          renderItem={renderItem}
        />
      ))}
    </Stack>
  );
}

interface GridCellProps<TItem extends { id: string }> {
  item: TItem | undefined;
  rowIndex: number;
  columnIndex: number;
  isTabStop: boolean;
  renderItem: (item: TItem, props: GridItemProps) => ReactNode;
}

function GridCell<TItem extends { id: string }>({
  item,
  rowIndex,
  columnIndex,
  isTabStop,
  renderItem,
}: GridCellProps<TItem>) {
  return (
    <Stack
      role="gridcell"
      aria-rowindex={rowIndex + 1}
      aria-colindex={columnIndex + 1}
      sx={gridCellSx}
    >
      {item && renderItem(item, { tabIndex: isTabStop ? 0 : -1 })}
    </Stack>
  );
}
