import CssBaseline from "@mui/material/CssBaseline";
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { assertDefined } from "@shared/testing/assert-defined";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import {
  getCellPosition,
  getGridItem,
  makeGridItems,
  renderGrid,
  renderGridButton,
} from "../testing/render-grid";
import { Grid } from "./grid";

const cssVariableTheme = createTheme({ cssVariables: true });

// The test viewport is below "sm", where the grid uses compact padding.
const PADDING_PX = 16;
const MIN_CELL_SIZE_PX = 96;

const AXES = {
  columns: {
    start: "left",
    end: "right",
    size: "width",
    scrollSize: "scrollWidth",
    clientSize: "clientWidth",
  },
  rows: {
    start: "top",
    end: "bottom",
    size: "height",
    scrollSize: "scrollHeight",
    clientSize: "clientHeight",
  },
} as const;

type Axis = keyof typeof AXES;

function itemIds(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index + 1);
}

async function measureTracks(
  axis: Axis,
  containerSize: number,
  tracks: number,
) {
  const isColumns = axis === "columns";

  const screen = await render(
    <MUIThemeProvider theme={cssVariableTheme}>
      <CssBaseline />
      <div
        style={
          isColumns
            ? { width: containerSize, height: 400 }
            : { width: 400, height: containerSize }
        }
      >
        <Grid
          items={makeGridItems(...itemIds(tracks))}
          rows={isColumns ? 1 : tracks}
          columns={isColumns ? tracks : 1}
          renderItem={renderGridButton}
        />
      </div>
    </MUIThemeProvider>,
  );

  const grid = screen.getByRole("grid").element();
  const scroller = grid.parentElement;
  assertDefined(scroller);

  const { start, end, size, scrollSize, clientSize } = AXES[axis];
  const viewport = scroller.getBoundingClientRect();
  const cells = Array.from(grid.querySelectorAll("[role='gridcell']"), (cell) =>
    cell.getBoundingClientRect(),
  );
  const visibleCells = cells.filter(
    (cell) =>
      cell[start] >= viewport[start] && cell[end] <= viewport[end] + 0.5,
  );

  return {
    cellSize: cells[0][size],
    lastVisibleCellEnd: visibleCells.at(-1)?.[end],
    viewportContentEnd: viewport[end] - PADDING_PX,
    visibleCellCount: visibleCells.length,
    overflows: scroller[scrollSize] > scroller[clientSize] + 1,
  };
}

describe("Grid", () => {
  describe("default grid construction (order not provided)", () => {
    test("renders items in row-major order when order is not provided", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2, 3, 4),
      });

      const item1 = getGridItem(screen, 1);
      const item2 = getGridItem(screen, 2);
      const item3 = getGridItem(screen, 3);
      const item4 = getGridItem(screen, 4);

      expect(getCellPosition(item1)).toEqual({ row: 0, column: 0 });
      expect(getCellPosition(item2)).toEqual({ row: 0, column: 1 });
      expect(getCellPosition(item3)).toEqual({ row: 1, column: 0 });
      expect(getCellPosition(item4)).toEqual({ row: 1, column: 1 });
    });

    test("renders only provided items when fewer than grid capacity", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2),
      });

      await expect.element(getGridItem(screen, 1)).toBeVisible();
      await expect.element(getGridItem(screen, 2)).toBeVisible();

      const allButtons = screen.getByRole("button").all();
      expect(allButtons).toHaveLength(2);
    });

    test("limits rendered items to grid capacity", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 2,
        items: makeGridItems(...itemIds(10)),
      });

      const buttons = screen.getByRole("button").all();
      expect(buttons).toHaveLength(4);

      expect(getGridItem(screen, 5).query()).toBeNull();
    });

    test("renders no items when items is empty", async () => {
      const screen = await renderGrid({ rows: 2, columns: 2, items: [] });

      const buttons = screen.getByRole("button").query();
      expect(buttons).toBeNull();
    });
  });

  describe("ordered grid construction (order provided)", () => {
    test("renders items according to order matrix", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2, 3, 4),
        order: [
          ["4", "3"],
          ["2", "1"],
        ],
      });

      const item1 = getGridItem(screen, 1);
      const item2 = getGridItem(screen, 2);
      const item3 = getGridItem(screen, 3);
      const item4 = getGridItem(screen, 4);

      expect(getCellPosition(item4)).toEqual({ row: 0, column: 0 });
      expect(getCellPosition(item3)).toEqual({ row: 0, column: 1 });
      expect(getCellPosition(item2)).toEqual({ row: 1, column: 0 });
      expect(getCellPosition(item1)).toEqual({ row: 1, column: 1 });
    });

    test("treats nulls in order matrix as empty cells", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2),
        order: [
          ["1", null],
          [null, "2"],
        ],
      });

      const item1 = getGridItem(screen, 1);
      const item2 = getGridItem(screen, 2);

      expect(getCellPosition(item1)).toEqual({ row: 0, column: 0 });
      expect(getCellPosition(item2)).toEqual({ row: 1, column: 1 });

      const allButtons = screen.getByRole("button").all();
      expect(allButtons).toHaveLength(2);
    });

    test("ignores unknown ids in order matrix", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2),
        order: [
          ["1", "999"],
          ["2", null],
        ],
      });

      const buttons = screen.getByRole("button").all();
      expect(buttons).toHaveLength(2);
    });
  });

  describe("accessibility", () => {
    test("exposes ariaLabel as the grid's accessible name", async () => {
      const screen = await renderGrid({
        ariaLabel: "Core words",
        rows: 1,
        columns: 1,
        items: makeGridItems(1),
      });

      await expect
        .element(screen.getByRole("grid", { name: "Core words" }))
        .toBeVisible();
    });
  });

  describe("responsive sizing", () => {
    const FIT_CASES = [
      { containerSize: 1000, tracks: 20, visible: 9 },
      { containerSize: 1000, tracks: 4, visible: 4 },
      { containerSize: 375, tracks: 20, visible: 3 },
    ];

    test.each(
      (["columns", "rows"] as const).flatMap((axis) =>
        FIT_CASES.map((fitCase) => ({ axis, ...fitCase })),
      ),
    )(
      "fits $visible whole $axis of at least 96px into $containerSize px for a $tracks-track board",
      async ({ axis, containerSize, tracks, visible }) => {
        const layout = await measureTracks(axis, containerSize, tracks);

        expect(layout.visibleCellCount).toBe(visible);
        expect(layout.cellSize).toBeGreaterThanOrEqual(MIN_CELL_SIZE_PX);
        expect(layout.lastVisibleCellEnd).toBeCloseTo(
          layout.viewportContentEnd,
          0,
        );
        expect(layout.overflows).toBe(tracks > visible);
      },
    );

    test.each(["columns", "rows"] as const)(
      "keeps %s at the 96px floor in a container smaller than one cell",
      async (axis) => {
        const layout = await measureTracks(axis, 120, 1);

        expect(layout.cellSize).toBeGreaterThanOrEqual(MIN_CELL_SIZE_PX);
        expect(layout.overflows).toBe(true);
      },
    );
  });
});
