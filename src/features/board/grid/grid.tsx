import Box from "@mui/material/Box";
import Stack, { type StackProps } from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import type { ReactNode, Ref } from "react";
import { Fragment } from "react";
import { useGridKeyboard } from "./use-grid-keyboard";

const MUI_SPACING_UNIT_PX = 8;
const MIN_CELL_SIZE_PX = 96;
const MIN_CELL_SIZE = `${MIN_CELL_SIZE_PX}px`;
const PAD = "var(--pad)";
const PAD_TOTAL = `calc(2 * ${PAD})`;
const SMALL_SCREEN_PADDING = 2;
const DEFAULT_PADDING = 3;

type GridOrder = readonly (readonly (string | null)[])[];

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
    <Box
      ref={ref}
      dir={dir}
      sx={(theme) => ({
        "--pad": theme.spacing(DEFAULT_PADDING),
        height: "100%",
        overflow: "auto",
        containerType: "size",
        scrollSnapType: "both proximity",
        scrollPadding: PAD,
        [theme.breakpoints.down("sm")]: {
          "--pad": theme.spacing(SMALL_SCREEN_PADDING),
        },
      })}
    >
      <Stack
        {...rootProps}
        ref={rootRef}
        role="grid"
        aria-label={ariaLabel}
        direction="column"
        sx={(theme) => ({
          "--visible-cols": 1,
          "--visible-rows": 1,
          [theme.breakpoints.down("sm")]: visibleTrackQueries(
            rows,
            columns,
            gap,
            SMALL_SCREEN_PADDING,
          ),
          [theme.breakpoints.up("sm")]: visibleTrackQueries(
            rows,
            columns,
            gap,
            DEFAULT_PADDING,
          ),
          "--cell-width": trackSize(
            theme,
            "100cqi",
            gap,
            "var(--visible-cols)",
          ),
          "--cell-height": trackSize(
            theme,
            "100cqb",
            gap,
            "var(--visible-rows)",
          ),
          minWidth: gridExtent(theme, "var(--cell-width)", gap, columns),
          minHeight: gridExtent(theme, "var(--cell-height)", gap, rows),
          p: PAD,
          gap,
        })}
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
                sx={{
                  flex: 1,
                  minWidth: "var(--cell-width)",
                  minHeight: MIN_CELL_SIZE,
                  scrollSnapAlign: "start",
                }}
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

export function GridRow({ children, gap, ...rootProps }: GridRowProps) {
  return (
    <Stack
      {...rootProps}
      role="row"
      direction="row"
      sx={{ flex: 1, minHeight: "var(--cell-height)", gap }}
    >
      {children}
    </Stack>
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

function visibleTrackQueries(
  rows: number,
  columns: number,
  gap: number,
  padding: number,
): Record<string, Record<string, number>> {
  return {
    ...trackAxisQueries("min-width", "--visible-cols", columns, gap, padding),
    ...trackAxisQueries("min-height", "--visible-rows", rows, gap, padding),
  };
}

function trackAxisQueries(
  feature: "min-width" | "min-height",
  property: "--visible-cols" | "--visible-rows",
  count: number,
  gap: number,
  padding: number,
): Record<string, Record<string, number>> {
  const steps: [string, Record<string, number>][] = Array.from(
    { length: Math.max(0, count - 1) },
    (_, index) => {
      const visible = index + 2;
      const threshold = trackFitThreshold(visible, gap, padding);

      return [`@container (${feature}: ${threshold})`, { [property]: visible }];
    },
  );

  return Object.fromEntries(steps);
}

function trackFitThreshold(
  count: number,
  gap: number,
  padding: number,
): string {
  const threshold =
    count * MIN_CELL_SIZE_PX +
    (count - 1) * gap * MUI_SPACING_UNIT_PX +
    2 * padding * MUI_SPACING_UNIT_PX;

  return `${threshold}px`;
}

function trackSize(
  theme: Theme,
  extent: string,
  gap: number,
  visible: string,
): string {
  return `calc((${extent} - ${PAD_TOTAL} - (${visible} - 1) * ${theme.spacing(gap)}) / ${visible})`;
}

function gridExtent(
  theme: Theme,
  cellSize: string,
  gap: number,
  count: number,
): string {
  return `calc(${count} * ${cellSize} + ${count - 1} * ${theme.spacing(gap)} + ${PAD_TOTAL})`;
}
