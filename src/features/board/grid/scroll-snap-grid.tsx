import Box from "@mui/material/Box";
import { useRef } from "react";
import { Grid, type GridProps } from "./grid";
import { useGridSnap } from "./use-grid-snap";

/**
 * Renders a board at its authored size and turns any overflow into a
 * scroll-snapping view instead of free two-axis scrollbars.
 *
 * Nothing is reflowed: every button keeps its authored position. Snap points
 * are placed on page-boundary rows (block axis) and cells (inline axis) by
 * targeting the grid's ARIA roles from here, so `Grid` stays snap-agnostic.
 */
export function ScrollSnapGrid<TItem extends { id: string }>(
  props: GridProps<TItem>,
) {
  const { columns, rows, gap = 2 } = props;
  const scrollRef = useRef<HTMLDivElement>(null);
  const { snapColumns, snapRows, snapType } = useGridSnap(
    scrollRef,
    columns,
    rows,
    gap,
  );

  return (
    <Box
      ref={scrollRef}
      sx={(theme) => ({
        flexGrow: 1,
        minHeight: 0,
        overflow: "auto",
        overscrollBehavior: "contain",
        scrollSnapType: snapType,
        // Inset snap positions by the grid's own padding so snapping to a page
        // boundary doesn't scroll the top/left padding out of view.
        scrollPaddingInlineStart: theme.spacing(gap),
        scrollPaddingBlockStart: theme.spacing(gap),
        // Present as snapping pages, not scrollbars.
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        // Snap stride lives here, keyed off the grid's ARIA roles, so the grid
        // component stays unaware of scrolling.
        [`& [role="row"]:nth-of-type(${snapRows}n + 1)`]: {
          scrollSnapAlign: "start none",
          scrollSnapStop: "always",
        },
        [`& [role="gridcell"]:nth-of-type(${snapColumns}n + 1)`]: {
          scrollSnapAlign: "none start",
          scrollSnapStop: "always",
        },
      })}
    >
      <Grid {...props} />
    </Box>
  );
}
