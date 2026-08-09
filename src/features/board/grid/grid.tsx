import Box from "@mui/material/Box";
import Stack, { type StackProps } from "@mui/material/Stack";
import { mergeSx } from "@shared/theme/merge-sx";
import type { ReactNode, Ref } from "react";
import { Fragment } from "react";
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

export interface GridRowProps extends Omit<
  StackProps,
  "children" | "direction" | "gap" | "role"
> {
  children: ReactNode;
  gap: number;
}

interface GridProps<TItem extends { id: string }> {
  ariaLabel?: string;
  items: readonly TItem[];
  rows: number;
  columns: number;
  order?: GridOrder;
  renderItem: (item: TItem, props: GridItemProps) => ReactNode;
  renderRow?: (
    items: readonly (TItem | undefined)[],
    rowIndex: number,
    props: GridRowProps,
  ) => ReactNode;
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
  renderRow,
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
          const rowProps = { gap, children: cells };

          return renderRow ? (
            <Fragment key={rowIndex}>
              {renderRow(row, rowIndex, rowProps)}
            </Fragment>
          ) : (
            <GridRow key={rowIndex} gap={gap}>
              {cells}
            </GridRow>
          );
        })}
      </Stack>
    </Box>
  );
}

export function GridRow({ children, gap, sx, ...rootProps }: GridRowProps) {
  return (
    <Stack
      {...rootProps}
      role="row"
      direction="row"
      sx={mergeSx(createGridRowSx(gap), sx)}
    >
      {children}
    </Stack>
  );
}
