import CssBaseline from "@mui/material/CssBaseline";
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { assertDefined } from "@shared/testing/assert-defined";
import { setTestViewport } from "@shared/testing/viewport";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { getCellPosition } from "../testing/get-cell-position";
import { rowMajorOrder } from "../testing/row-major-order";
import { Grid } from "./grid";

const cssVariableTheme = createTheme({ cssVariables: true });

// Expected dimensions for the test viewport below sm.
const PADDING_PX = { columns: 16, rows: 12 };
const OVERFLOW_HINT_PX = 8;
const GAP_PX = 8;
const MIN_CELL_SIZES_PX = { columns: 88, rows: 96 };

// Expected dimensions for a viewport at or above sm.
const SM_PADDING_PX = { columns: 24, rows: 16 };
const SM_OVERFLOW_HINT_PX = 16;

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

async function measureTracks(
  axis: Axis,
  containerSize: number,
  tracks: number,
  {
    itemSize,
    scrollToTrack,
    focusTrack,
  }: { itemSize?: number; scrollToTrack?: number; focusTrack?: number } = {},
) {
  const isColumns = axis === "columns";
  const items = Array.from({ length: tracks }, (_, index) => ({
    id: String(index + 1),
    label: `Item ${index + 1}`,
  }));

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
          aria-label="Board"
          items={items}
          rows={isColumns ? 1 : tracks}
          columns={isColumns ? tracks : 1}
          order={rowMajorOrder(
            items,
            isColumns ? 1 : tracks,
            isColumns ? tracks : 1,
          )}
          renderItem={(item, props) => (
            <button
              {...props}
              style={{ flexShrink: 0, [AXES[axis].size]: itemSize }}
            >
              {item.label}
            </button>
          )}
        />
      </div>
    </MUIThemeProvider>,
  );

  const grid = screen.getByRole("grid").element();
  const scroller = grid.parentElement;
  assertDefined(scroller);

  if (scrollToTrack !== undefined) {
    scrollTrackToStart(grid, axis, scrollToTrack);
  }

  if (focusTrack !== undefined) {
    const item = grid.querySelectorAll("button").item(focusTrack);
    assertDefined(item);
    item.focus();
  }

  const { start, end, size, scrollSize, clientSize } = AXES[axis];
  const viewport = scroller.getBoundingClientRect();
  const cells = Array.from(grid.querySelectorAll("[role='gridcell']"), (cell) =>
    cell.getBoundingClientRect(),
  );
  const visibleCells = cells.filter(
    (cell) =>
      cell[start] >= viewport[start] - 0.5 && cell[end] <= viewport[end] + 0.5,
  );
  const firstVisibleCell = visibleCells.at(0);
  const lastVisibleCell = visibleCells.at(-1);
  const leadingCell = cells.find(
    (cell) =>
      cell[start] < viewport[start] - 0.5 && cell[end] > viewport[start],
  );
  const trailingCell = cells.find(
    (cell) => cell[start] < viewport[end] && cell[end] > viewport[end] + 0.5,
  );

  return {
    cellSize: cells[0]?.[size],
    visibleCellCount: visibleCells.length,
    leadingSpace: firstVisibleCell && firstVisibleCell[start] - viewport[start],
    trailingSpace: lastVisibleCell && viewport[end] - lastVisibleCell[end],
    leadingHint: leadingCell ? leadingCell[end] - viewport[start] : 0,
    trailingHint: trailingCell ? viewport[end] - trailingCell[start] : 0,
    overflows: scroller[scrollSize] > scroller[clientSize] + 1,
  };
}

function scrollTrackToStart(grid: Element, axis: Axis, index: number) {
  const selector = axis === "columns" ? "[role='gridcell']" : "[role='row']";
  const track = grid.querySelectorAll(selector).item(index);
  assertDefined(track);

  track.scrollIntoView({
    block: "start",
    inline: "start",
    behavior: "instant",
  });
}

describe("Grid", () => {
  describe("placement", () => {
    test("leaves out items the order does not name", async () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: String(i + 1),
        label: `Item ${i + 1}`,
      }));

      const screen = await render(
        <Grid
          aria-label="Board"
          items={items}
          rows={2}
          columns={2}
          order={[
            ["1", "2"],
            ["3", "4"],
          ]}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const buttons = screen.getByRole("button").all();
      expect(buttons).toHaveLength(4);

      expect(
        screen.getByRole("button", { name: "Item 5", exact: true }).query(),
      ).toBeNull();
    });

    test("renders no items when items is empty", async () => {
      const screen = await render(
        <Grid
          aria-label="Board"
          items={[]}
          rows={2}
          columns={2}
          order={[
            [null, null],
            [null, null],
          ]}
          renderItem={(item: { id: string; label: string }, props) => (
            <button {...props}>{item.label}</button>
          )}
        />,
      );

      const buttons = screen.getByRole("button").query();
      expect(buttons).toBeNull();
    });

    test("places items by the order matrix", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
        { id: "3", label: "Item 3" },
        { id: "4", label: "Item 4" },
      ];

      const order = [
        ["4", "3"],
        ["2", "1"],
      ];

      const screen = await render(
        <Grid
          aria-label="Board"
          items={items}
          rows={2}
          columns={2}
          order={order}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });
      const item4 = screen.getByRole("button", { name: "Item 4", exact: true });

      expect(getCellPosition(item4)).toEqual({ row: 0, column: 0 });
      expect(getCellPosition(item3)).toEqual({ row: 0, column: 1 });
      expect(getCellPosition(item2)).toEqual({ row: 1, column: 0 });
      expect(getCellPosition(item1)).toEqual({ row: 1, column: 1 });
    });

    test("treats nulls in order matrix as empty cells", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
      ];

      const order = [
        ["1", null],
        [null, "2"],
      ];

      const screen = await render(
        <Grid
          aria-label="Board"
          items={items}
          rows={2}
          columns={2}
          order={order}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      expect(getCellPosition(item1)).toEqual({ row: 0, column: 0 });
      expect(getCellPosition(item2)).toEqual({ row: 1, column: 1 });

      const allButtons = screen.getByRole("button").all();
      expect(allButtons).toHaveLength(2);
    });

    test("ignores unknown ids in order matrix", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
      ];

      const order = [
        ["1", "999"],
        ["2", null],
      ];

      const screen = await render(
        <Grid
          aria-label="Board"
          items={items}
          rows={2}
          columns={2}
          order={order}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const buttons = screen.getByRole("button").all();
      expect(buttons).toHaveLength(2);
    });
  });

  describe("accessibility", () => {
    test("exposes aria-label as the grid's accessible name", async () => {
      const items = [{ id: "1", label: "Item 1" }];

      const screen = await render(
        <Grid
          aria-label="Core words"
          items={items}
          rows={1}
          columns={1}
          order={rowMajorOrder(items, 1, 1)}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      await expect
        .element(screen.getByRole("grid", { name: "Core words" }))
        .toBeVisible();
    });
  });

  describe("row props", () => {
    test("spreads rowProps onto every row", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
      ];

      const screen = await render(
        <Grid
          aria-label="Board"
          items={items}
          rows={2}
          columns={1}
          order={rowMajorOrder(items, 2, 1)}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
          rowProps={{ "data-testid": "grid-row" }}
        />,
      );

      const rows = screen.getByRole("row").all();
      expect(rows).toHaveLength(2);
      for (const row of rows) {
        await expect.element(row).toHaveAttribute("data-testid", "grid-row");
      }
    });
  });

  describe("responsive sizing", () => {
    const FIT_CASES = [
      { axis: "columns", containerSize: 1000, tracks: 20, visible: 10 },
      { axis: "columns", containerSize: 1000, tracks: 4, visible: 4 },
      { axis: "columns", containerSize: 375, tracks: 20, visible: 3 },
      { axis: "rows", containerSize: 1000, tracks: 20, visible: 9 },
      { axis: "rows", containerSize: 1000, tracks: 4, visible: 4 },
      { axis: "rows", containerSize: 375, tracks: 20, visible: 3 },
    ] as const;

    test.each(FIT_CASES)(
      "fits $visible whole $axis into $containerSize px for a $tracks-track board",
      async ({ axis, containerSize, tracks, visible }) => {
        const layout = await measureTracks(axis, containerSize, tracks);

        expect(layout.visibleCellCount).toBe(visible);
        expect(layout.cellSize).toBeGreaterThanOrEqual(MIN_CELL_SIZES_PX[axis]);
        expect(layout.leadingSpace).toBeCloseTo(PADDING_PX[axis], 0);
        expect(layout.overflows).toBe(tracks > visible);

        const expectedTrailingSpace = layout.overflows
          ? GAP_PX + OVERFLOW_HINT_PX
          : PADDING_PX[axis];
        expect(layout.trailingSpace).toBeCloseTo(expectedTrailingSpace, 0);
      },
    );

    test.each(["columns", "rows"] as const)(
      "shows the same hint of the %s on both sides of a track scrolled to the start",
      async (axis) => {
        const layout = await measureTracks(axis, 375, 20, {
          scrollToTrack: 5,
        });

        expect(layout.visibleCellCount).toBe(3);
        expect(layout.leadingHint).toBeGreaterThan(0);
        expect(Math.abs(layout.leadingHint - layout.trailingHint)).toBeLessThan(
          1,
        );
      },
    );

    test.each(["columns", "rows"] as const)(
      "shows a hint of the %s on the leading side only at the end of the scroll",
      async (axis) => {
        const layout = await measureTracks(axis, 375, 20, {
          scrollToTrack: 19,
        });

        expect(layout.visibleCellCount).toBe(3);
        expect(layout.leadingHint).toBeCloseTo(OVERFLOW_HINT_PX, 0);
        expect(layout.trailingSpace).toBeCloseTo(PADDING_PX[axis], 0);
      },
    );

    test.each(["columns", "rows"] as const)(
      "scrolls the hinted track of the %s into view when its item takes focus",
      async (axis) => {
        const layout = await measureTracks(axis, 375, 20, { focusTrack: 3 });

        expect(layout.visibleCellCount).toBe(3);
        expect(layout.leadingHint).toBeGreaterThan(0);
        expect(Math.abs(layout.leadingHint - layout.trailingHint)).toBeLessThan(
          1,
        );
      },
    );

    test.each(["columns", "rows"] as const)(
      "widens the padding and the hint of the %s on a screen at or above sm",
      async (axis) => {
        await setTestViewport(800, 600);

        const layout = await measureTracks(axis, 375, 20);

        expect(layout.visibleCellCount).toBe(3);
        expect(layout.leadingSpace).toBeCloseTo(SM_PADDING_PX[axis], 0);
        expect(layout.trailingSpace).toBeCloseTo(
          GAP_PX + SM_OVERFLOW_HINT_PX,
          0,
        );
        expect(layout.trailingHint).toBeCloseTo(SM_OVERFLOW_HINT_PX, 0);
      },
    );

    test.each(["columns", "rows"] as const)(
      "keeps %s at the fitted size when an item is larger than its cell",
      async (axis) => {
        const layout = await measureTracks(axis, 375, 20, { itemSize: 150 });

        expect(layout.visibleCellCount).toBe(3);
        expect(layout.trailingHint).toBeCloseTo(OVERFLOW_HINT_PX, 0);
      },
    );

    test.each(["columns", "rows"] as const)(
      "keeps %s at the minimum cell size in a container smaller than one cell",
      async (axis) => {
        const layout = await measureTracks(axis, 80, 1);

        expect(layout.cellSize).toBeGreaterThanOrEqual(MIN_CELL_SIZES_PX[axis]);
        expect(layout.overflows).toBe(true);
      },
    );
  });
});
