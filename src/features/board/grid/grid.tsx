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

/** The grid moves focus to the element that carries these, so every item must render one. */
export interface GridItemProps {
  tabIndex: number;
}

type GridRowDataAttributes = Record<`data-${string}`, string>;

interface GridProps<Item extends { id: string }> {
  "aria-label": string;
  items: readonly Item[];
  order: GridOrder;
  rowProps?: GridRowDataAttributes;
  renderItem: (item: Item, props: GridItemProps) => ReactNode;
}

export function Grid<Item extends { id: string }>({
  "aria-label": ariaLabel,
  items,
  order,
  rowProps,
  renderItem,
}: GridProps<Item>) {
  const grid = buildGrid(items, order);
  const { rootRef, rootProps, tabStopPosition } = useGridFocus(grid);
  const rows = grid.length;
  const columns = grid[0]?.length ?? 0;

  return (
    <Box sx={createGridViewportSx}>
      <Stack
        {...rootProps}
        ref={rootRef}
        role="grid"
        aria-label={ariaLabel}
        direction="column"
        sx={(theme) => createGridContentSx(theme, { rows, columns })}
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
            rowProps={rowProps}
            renderItem={renderItem}
          />
        ))}
      </Stack>
    </Box>
  );
}

interface GridRowProps<Item extends { id: string }> {
  items: readonly (Item | undefined)[];
  rowIndex: number;
  tabStopColumn: number | undefined;
  rowProps: GridRowDataAttributes | undefined;
  renderItem: (item: Item, props: GridItemProps) => ReactNode;
}

function GridRow<Item extends { id: string }>({
  items,
  rowIndex,
  tabStopColumn,
  rowProps,
  renderItem,
}: GridRowProps<Item>) {
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

interface GridCellProps<Item extends { id: string }> {
  item: Item | undefined;
  rowIndex: number;
  columnIndex: number;
  isTabStop: boolean;
  renderItem: (item: Item, props: GridItemProps) => ReactNode;
}

function GridCell<Item extends { id: string }>({
  item,
  rowIndex,
  columnIndex,
  isTabStop,
  renderItem,
}: GridCellProps<Item>) {
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
