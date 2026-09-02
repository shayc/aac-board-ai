import CssBaseline from "@mui/material/CssBaseline";
import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import type { Locator } from "vitest/browser";
import { Grid } from "./grid";

const cssVariableTheme = createTheme({ cssVariables: true });

function getCellPosition(item: Locator): { row: number; col: number } {
  const cell = item.element().closest("[role='gridcell']");

  if (!cell) {
    throw new Error("Item is not inside a grid cell");
  }

  const row = parseInt(cell.getAttribute("aria-rowindex") ?? "", 10) - 1;
  const col = parseInt(cell.getAttribute("aria-colindex") ?? "", 10) - 1;

  if (isNaN(row) || isNaN(col)) {
    throw new Error("Grid cell missing valid aria-rowindex or aria-colindex");
  }

  return { row, col };
}

describe("Grid", () => {
  describe("default grid construction (order not provided)", () => {
    test("renders items in row-major order when order is not provided", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
        { id: "3", label: "Item 3" },
        { id: "4", label: "Item 4" },
      ];

      const screen = await render(
        <Grid
          rows={2}
          columns={2}
          items={items}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });
      const item4 = screen.getByRole("button", { name: "Item 4", exact: true });

      expect(getCellPosition(item1)).toEqual({ row: 0, col: 0 });
      expect(getCellPosition(item2)).toEqual({ row: 0, col: 1 });
      expect(getCellPosition(item3)).toEqual({ row: 1, col: 0 });
      expect(getCellPosition(item4)).toEqual({ row: 1, col: 1 });
    });

    test("renders only provided items when fewer than grid capacity", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
      ];

      const screen = await render(
        <Grid
          rows={2}
          columns={2}
          items={items}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      await expect
        .element(screen.getByRole("button", { name: "Item 1" }))
        .toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: "Item 2" }))
        .toBeVisible();

      const allButtons = screen.getByRole("button").all();
      expect(allButtons).toHaveLength(2);
    });

    test("limits rendered items to grid capacity", async () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        id: String(i + 1),
        label: `Item ${i + 1}`,
      }));

      const screen = await render(
        <Grid
          rows={2}
          columns={2}
          items={items}
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
          rows={2}
          columns={2}
          items={[]}
          renderItem={(item: { id: string; label: string }, props) => (
            <button {...props}>{item.label}</button>
          )}
        />,
      );

      const buttons = screen.getByRole("button").query();
      expect(buttons).toBeNull();
    });
  });

  describe("ordered grid construction (order provided)", () => {
    test("renders items according to order matrix", async () => {
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
          rows={2}
          columns={2}
          items={items}
          order={order}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });
      const item4 = screen.getByRole("button", { name: "Item 4", exact: true });

      expect(getCellPosition(item4)).toEqual({ row: 0, col: 0 });
      expect(getCellPosition(item3)).toEqual({ row: 0, col: 1 });
      expect(getCellPosition(item2)).toEqual({ row: 1, col: 0 });
      expect(getCellPosition(item1)).toEqual({ row: 1, col: 1 });
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
          rows={2}
          columns={2}
          items={items}
          order={order}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      expect(getCellPosition(item1)).toEqual({ row: 0, col: 0 });
      expect(getCellPosition(item2)).toEqual({ row: 1, col: 1 });

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
          rows={2}
          columns={2}
          items={items}
          order={order}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const buttons = screen.getByRole("button").all();
      expect(buttons).toHaveLength(2);
    });
  });

  describe("accessibility", () => {
    test("exposes ariaLabel as the grid's accessible name", async () => {
      const items = [{ id: "1", label: "Item 1" }];

      const screen = await render(
        <Grid
          ariaLabel="Core words"
          items={items}
          rows={1}
          columns={1}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      await expect
        .element(screen.getByRole("grid", { name: "Core words" }))
        .toBeVisible();
    });
  });

  describe("responsive column sizing", () => {
    // This suite's test viewport is narrower than the theme's "sm" breakpoint,
    // so the grid's --pad is theme.spacing(2) here, not the theme.spacing(3)
    // default used above that breakpoint.
    const PAD = 16;
    const GAP = 8;
    const MIN_CELL = 96;

    const expectedCellWidth = (containerWidth: number, columns: number) => {
      const fit = Math.floor(
        (containerWidth - 2 * PAD + GAP) / (MIN_CELL + GAP),
      );
      const visible = Math.min(columns, Math.max(1, fit));

      return (containerWidth - 2 * PAD - (visible - 1) * GAP) / visible;
    };

    const renderSizedGrid = async (containerWidth: number, columns: number) => {
      const items = Array.from({ length: columns }, (_, i) => ({
        id: String(i + 1),
        label: `Item ${i + 1}`,
      }));

      const screen = await render(
        <MUIThemeProvider theme={cssVariableTheme}>
          <CssBaseline />
          <div style={{ width: `${containerWidth}px`, height: "400px" }}>
            <Grid
              rows={1}
              columns={columns}
              items={items}
              renderItem={(item, props) => (
                <button {...props}>{item.label}</button>
              )}
            />
          </div>
        </MUIThemeProvider>,
      );

      const gridEl = screen.getByRole("grid").element();
      const cellEl = gridEl.querySelector("[role='gridcell']");
      if (!(cellEl instanceof HTMLElement)) {
        throw new Error("grid rendered no cell");
      }

      const scroller = gridEl.parentElement;
      if (!scroller) {
        throw new Error("grid has no scroll container");
      }

      return {
        cellWidth: cellEl.getBoundingClientRect().width,
        expectedWidth: expectedCellWidth(containerWidth, columns),
        overflows: scroller.scrollWidth > scroller.clientWidth + 1,
      };
    };

    test("enlarges cells past the floor to fill the width when a wide board overflows", async () => {
      const { cellWidth, expectedWidth, overflows } = await renderSizedGrid(
        1000,
        20,
      );

      expect(cellWidth).toBeGreaterThan(MIN_CELL);
      expect(Math.abs(cellWidth - expectedWidth)).toBeLessThan(1.5);
      expect(overflows).toBe(true);
    });

    test("grows cells to fill the width when the whole board fits", async () => {
      const { cellWidth, expectedWidth, overflows } = await renderSizedGrid(
        1000,
        4,
      );

      expect(Math.abs(cellWidth - expectedWidth)).toBeLessThan(1.5);
      expect(overflows).toBe(false);
    });

    test("settles on three columns at a phone width, never below the 96px floor", async () => {
      const { cellWidth, expectedWidth, overflows } = await renderSizedGrid(
        375,
        20,
      );

      expect(cellWidth).toBeGreaterThanOrEqual(MIN_CELL);
      expect(Math.abs(cellWidth - expectedWidth)).toBeLessThan(1.5);
      expect(overflows).toBe(true);
    });

    test("preserves the 96px floor when the container is narrower than one cell", async () => {
      const { cellWidth, overflows } = await renderSizedGrid(120, 1);

      expect(cellWidth).toBeGreaterThanOrEqual(MIN_CELL);
      expect(overflows).toBe(true);
    });
  });

  describe("responsive row sizing", () => {
    // Same narrower-than-"sm" test viewport as the column-sizing suite above.
    const PAD = 16;
    const GAP = 8;
    const MIN_CELL = 96;

    const expectedCellHeight = (containerHeight: number, rows: number) => {
      const fit = Math.floor(
        (containerHeight - 2 * PAD + GAP) / (MIN_CELL + GAP),
      );
      const visible = Math.min(rows, Math.max(1, fit));

      return (containerHeight - 2 * PAD - (visible - 1) * GAP) / visible;
    };

    const renderSizedGrid = async (containerHeight: number, rows: number) => {
      const items = Array.from({ length: rows }, (_, i) => ({
        id: String(i + 1),
        label: `Item ${i + 1}`,
      }));

      const screen = await render(
        <MUIThemeProvider theme={cssVariableTheme}>
          <CssBaseline />
          <div style={{ width: "400px", height: `${containerHeight}px` }}>
            <Grid
              rows={rows}
              columns={1}
              items={items}
              renderItem={(item, props) => (
                <button {...props}>{item.label}</button>
              )}
            />
          </div>
        </MUIThemeProvider>,
      );

      const gridEl = screen.getByRole("grid").element();
      const cellEl = gridEl.querySelector("[role='gridcell']");
      if (!(cellEl instanceof HTMLElement)) {
        throw new Error("grid rendered no cell");
      }

      const scroller = gridEl.parentElement;
      if (!scroller) {
        throw new Error("grid has no scroll container");
      }

      return {
        cellHeight: cellEl.getBoundingClientRect().height,
        expectedHeight: expectedCellHeight(containerHeight, rows),
        overflows: scroller.scrollHeight > scroller.clientHeight + 1,
      };
    };

    test("enlarges cells past the floor to fill the height when a tall board overflows", async () => {
      const { cellHeight, expectedHeight, overflows } = await renderSizedGrid(
        1000,
        20,
      );

      expect(cellHeight).toBeGreaterThan(MIN_CELL);
      expect(Math.abs(cellHeight - expectedHeight)).toBeLessThan(1.5);
      expect(overflows).toBe(true);
    });

    test("grows cells to fill the height when the whole board fits", async () => {
      const { cellHeight, expectedHeight, overflows } = await renderSizedGrid(
        1000,
        4,
      );

      expect(Math.abs(cellHeight - expectedHeight)).toBeLessThan(1.5);
      expect(overflows).toBe(false);
    });

    test("settles on whole rows at a short height, never below the 96px floor", async () => {
      const { cellHeight, expectedHeight, overflows } = await renderSizedGrid(
        375,
        20,
      );

      expect(cellHeight).toBeGreaterThanOrEqual(MIN_CELL);
      expect(Math.abs(cellHeight - expectedHeight)).toBeLessThan(1.5);
      expect(overflows).toBe(true);
    });

    test("preserves the 96px floor when the container is shorter than one cell", async () => {
      const { cellHeight, overflows } = await renderSizedGrid(120, 1);

      expect(cellHeight).toBeGreaterThanOrEqual(MIN_CELL);
      expect(overflows).toBe(true);
    });
  });

  describe("scroll snapping", () => {
    const renderLine = async (
      style: { width: string; height: string },
      rows: number,
      columns: number,
    ) => {
      const items = Array.from({ length: rows * columns }, (_, i) => ({
        id: String(i + 1),
        label: `Item ${i + 1}`,
      }));

      const screen = await render(
        <>
          <CssBaseline />
          <div style={style}>
            <Grid
              rows={rows}
              columns={columns}
              items={items}
              renderItem={(item, props) => (
                <button {...props}>{item.label}</button>
              )}
            />
          </div>
        </>,
      );

      const grid = screen.getByRole("grid").element();
      const container = grid.parentElement;

      if (!(container instanceof HTMLElement)) {
        throw new Error("grid scroll container not found");
      }

      return {
        container,
        cells: grid.querySelectorAll<HTMLElement>("[role='gridcell']"),
      };
    };

    test("configures both-axis proximity snapping, cells aligned to start", async () => {
      const { container, cells } = await renderLine(
        { width: "1000px", height: "400px" },
        1,
        20,
      );

      expect(getComputedStyle(container).scrollSnapType).toBe("both");
      expect(getComputedStyle(cells[1]).scrollSnapAlign).toBe("start");
    });

    test("snaps per cell, not per page (no scroll-margin offset)", async () => {
      const { cells } = await renderLine(
        { width: "1000px", height: "400px" },
        1,
        20,
      );

      expect(
        parseFloat(getComputedStyle(cells[5]).scrollMarginLeft),
      ).toBeLessThan(1);
    });
  });
});
