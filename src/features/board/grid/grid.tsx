import Box from "@mui/material/Box";
import Stack, { type StackProps } from "@mui/material/Stack";
import type { Theme } from "@mui/material/styles";
import type { ReactNode, Ref } from "react";
import { Fragment } from "react";
import { useGridKeyboard } from "./use-grid-keyboard";

const MIN_CELL_SIZE = "96px";
const PAD = "var(--pad)";
const PAD_TOTAL = `calc(2 * ${PAD})`;

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

export interface GridProps<TItem extends { id: string }> {
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
        "--pad": theme.spacing(3),
        height: "100%",
        overflow: "auto",
        containerType: "size",
        scrollSnapType: "both proximity",
        scrollPadding: PAD,
        [theme.breakpoints.down("sm")]: {
          "--pad": theme.spacing(2),
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
          "--visible-cols": visibleTracks(theme, "100cqi", gap, columns),
          "--visible-rows": visibleTracks(theme, "100cqb", gap, rows),
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

function visibleTracks(
  theme: Theme,
  extent: string,
  gap: number,
  count: number,
): string {
  const inner = `${extent} - ${PAD_TOTAL}`;
  const pitch = `${MIN_CELL_SIZE} + ${theme.spacing(gap)}`;

  return `min(${count}, max(1, round(down, (${inner} + ${theme.spacing(gap)}) / (${pitch}), 1)))`;
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
