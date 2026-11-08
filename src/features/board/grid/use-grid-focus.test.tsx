import { describe, expect, test } from "vitest";
import { userEvent, type Locator } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  getCellPosition,
  getGridItem,
  gridElement,
  makeGridItems,
  renderGrid,
} from "../testing/render-grid";

async function press(
  item: Locator,
  key: string,
  modifiers: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {},
) {
  item.element().focus();
  let sequence = `{${key}}`;
  if (modifiers.shiftKey) {
    sequence = `{Shift>}${sequence}{/Shift}`;
  }

  if (modifiers.metaKey) {
    sequence = `{Meta>}${sequence}{/Meta}`;
  }

  if (modifiers.ctrlKey) {
    sequence = `{Control>}${sequence}{/Control}`;
  }

  await userEvent.keyboard(sequence);
}

describe("useGridFocus", () => {
  describe("tab stops", () => {
    test("sets tabIndex so only the tab stop is tabbable", async () => {
      const screen = await renderGrid({
        rows: 1,
        columns: 3,
        items: makeGridItems(1, 2, 3),
      });

      await expect
        .element(getGridItem(screen, 1))
        .toHaveAttribute("tabindex", "0");
      await expect
        .element(getGridItem(screen, 2))
        .toHaveAttribute("tabindex", "-1");
      await expect
        .element(getGridItem(screen, 3))
        .toHaveAttribute("tabindex", "-1");
    });

    test("makes first non-empty cell tabbable when (0,0) is empty", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2),
        order: [
          [null, "2"],
          ["1", null],
        ],
      });
      const item1 = getGridItem(screen, 1);
      const item2 = getGridItem(screen, 2);

      expect(getCellPosition(item2)).toEqual({ row: 0, column: 1 });
      expect(getCellPosition(item1)).toEqual({ row: 1, column: 0 });

      await expect.element(item2).toHaveAttribute("tabindex", "0");
      await expect.element(item1).toHaveAttribute("tabindex", "-1");
    });

    test("keeps a tab stop when the grid changes and the tab stop becomes empty while focus is outside the grid", async () => {
      const screen = await render(
        <div>
          <button>Outside</button>
          {gridElement({
            rows: 2,
            columns: 2,
            items: makeGridItems(1, 2, 3, 4),
          })}
        </div>,
      );

      getGridItem(screen, 4).element().focus();
      screen.getByRole("button", { name: "Outside" }).element().focus();

      await screen.rerender(
        <div>
          <button>Outside</button>
          {gridElement({ rows: 2, columns: 2, items: makeGridItems(5) })}
        </div>,
      );

      await expect
        .element(getGridItem(screen, 5))
        .toHaveAttribute("tabindex", "0");
    });

    test("leaves focus outside the grid when it re-renders with the same items", async () => {
      const items = makeGridItems(1, 2, 3, 4);
      const screen = await renderGrid({
        ariaLabel: "Board",
        rows: 2,
        columns: 2,
        items,
      });

      const item1 = getGridItem(screen, 1);
      item1.element().focus();
      item1.element().blur();

      await screen.rerender(
        gridElement({ ariaLabel: "Renamed board", rows: 2, columns: 2, items }),
      );

      await expect
        .element(screen.getByRole("grid", { name: "Renamed board" }))
        .toBeInTheDocument();
      expect(document.activeElement).toBe(document.body);
    });

    test("returns lost focus to the remembered cell when the grid changes", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2, 3, 4),
      });

      const focusedButton = getGridItem(screen, 2).element();
      focusedButton.focus();

      await screen.rerender(
        gridElement({ rows: 2, columns: 2, items: makeGridItems(5, 6, 7, 8) }),
      );

      expect(focusedButton.isConnected).toBe(false);
      await expect.element(getGridItem(screen, 6)).toHaveFocus();
    });
  });

  describe("arrow navigation", () => {
    test.each([
      { key: "ArrowUp", target: 2 },
      { key: "ArrowDown", target: 8 },
      { key: "ArrowLeft", target: 4 },
      { key: "ArrowRight", target: 6 },
    ])("moves focus to the adjacent cell on $key", async ({ key, target }) => {
      const screen = await renderGrid({
        rows: 3,
        columns: 3,
        items: makeGridItems(1, 2, 3, 4, 5, 6, 7, 8, 9),
      });

      await press(getGridItem(screen, 5), key);

      await expect.element(getGridItem(screen, target)).toHaveFocus();
    });

    test("falls back to the nearest diagonal cell when the arrow's line is empty", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2),
        order: [
          ["1", null],
          [null, "2"],
        ],
      });

      await press(getGridItem(screen, 1), "ArrowRight");

      await expect.element(getGridItem(screen, 2)).toHaveFocus();
    });

    test("prefers an in-line cell over a diagonal one", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 3,
        items: makeGridItems(1, 2, 3),
        order: [
          ["1", "2", null],
          [null, null, "3"],
        ],
      });

      await press(getGridItem(screen, 1), "ArrowRight");

      await expect.element(getGridItem(screen, 2)).toHaveFocus();
    });

    test("stays in place when no focusable cell exists in the arrow's direction", async () => {
      const screen = await renderGrid({
        rows: 1,
        columns: 2,
        items: makeGridItems(1),
      });
      const item1 = getGridItem(screen, 1);

      await press(item1, "ArrowDown");

      await expect.element(item1).toHaveFocus();
    });
  });

  describe("Home and End", () => {
    test("Home skips empty cells and lands on the first focusable cell in the row", async () => {
      const screen = await renderGrid({
        rows: 1,
        columns: 3,
        items: makeGridItems(2, 3),
        order: [[null, "2", "3"]],
      });

      await press(getGridItem(screen, 3), "Home");

      await expect.element(getGridItem(screen, 2)).toHaveFocus();
    });

    test("End skips empty cells and lands on the last focusable cell in the row", async () => {
      const screen = await renderGrid({
        rows: 1,
        columns: 3,
        items: makeGridItems(1, 2),
        order: [["1", "2", null]],
      });

      await press(getGridItem(screen, 1), "End");

      await expect.element(getGridItem(screen, 2)).toHaveFocus();
    });

    test("Ctrl+Home focuses the first focusable cell in the grid even when (0,0) is empty", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 2,
        items: makeGridItems(2, 3, 4),
        order: [
          [null, "2"],
          ["3", "4"],
        ],
      });

      await press(getGridItem(screen, 4), "Home", { ctrlKey: true });

      await expect.element(getGridItem(screen, 2)).toHaveFocus();
    });

    test("Ctrl+End focuses the last focusable cell in the grid even when the last cell is empty", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2, 3),
        order: [
          ["1", "2"],
          ["3", null],
        ],
      });

      await press(getGridItem(screen, 1), "End", { ctrlKey: true });

      await expect.element(getGridItem(screen, 3)).toHaveFocus();
    });

    test("Meta+Home and Meta+End match the Ctrl behavior on macOS", async () => {
      const screen = await renderGrid({
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2, 3, 4),
      });
      const item1 = getGridItem(screen, 1);
      const item4 = getGridItem(screen, 4);

      await press(item1, "End", { metaKey: true });
      await expect.element(item4).toHaveFocus();

      await press(item4, "Home", { metaKey: true });
      await expect.element(item1).toHaveFocus();
    });

    test("Shift+Home does not move focus", async () => {
      const screen = await renderGrid({
        rows: 1,
        columns: 3,
        items: makeGridItems(1, 2, 3),
      });
      const item3 = getGridItem(screen, 3);

      await press(item3, "Home", { shiftKey: true });

      await expect.element(item3).toHaveFocus();
    });
  });

  describe("right-to-left navigation", () => {
    test("ArrowRight moves to the previous column", async () => {
      const screen = await renderGrid({
        dir: "rtl",
        rows: 1,
        columns: 2,
        items: makeGridItems(1, 2),
      });

      await press(getGridItem(screen, 2), "ArrowRight");

      await expect.element(getGridItem(screen, 1)).toHaveFocus();
    });

    test("ArrowLeft moves to the next column", async () => {
      const screen = await renderGrid({
        dir: "rtl",
        rows: 1,
        columns: 2,
        items: makeGridItems(1, 2),
      });

      await press(getGridItem(screen, 1), "ArrowLeft");

      await expect.element(getGridItem(screen, 2)).toHaveFocus();
    });

    test("ArrowUp and ArrowDown are unaffected by direction", async () => {
      const screen = await renderGrid({
        dir: "rtl",
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2),
        order: [
          ["1", null],
          ["2", null],
        ],
      });
      const item1 = getGridItem(screen, 1);
      const item2 = getGridItem(screen, 2);

      await press(item1, "ArrowDown");
      await expect.element(item2).toHaveFocus();

      await press(item2, "ArrowUp");
      await expect.element(item1).toHaveFocus();
    });

    test("Home moves to the first cell in document order", async () => {
      const screen = await renderGrid({
        dir: "rtl",
        rows: 1,
        columns: 3,
        items: makeGridItems(1, 2, 3),
      });

      await press(getGridItem(screen, 3), "Home");

      await expect.element(getGridItem(screen, 1)).toHaveFocus();
    });

    test("End moves to the last cell in document order", async () => {
      const screen = await renderGrid({
        dir: "rtl",
        rows: 1,
        columns: 3,
        items: makeGridItems(1, 2, 3),
      });

      await press(getGridItem(screen, 1), "End");

      await expect.element(getGridItem(screen, 3)).toHaveFocus();
    });

    test("Ctrl+Home moves to the first cell in document order", async () => {
      const screen = await renderGrid({
        dir: "rtl",
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2, 3, 4),
      });

      await press(getGridItem(screen, 4), "Home", { ctrlKey: true });

      await expect.element(getGridItem(screen, 1)).toHaveFocus();
    });

    test("Ctrl+End moves to the last cell in document order", async () => {
      const screen = await renderGrid({
        dir: "rtl",
        rows: 2,
        columns: 2,
        items: makeGridItems(1, 2, 3, 4),
      });

      await press(getGridItem(screen, 1), "End", { ctrlKey: true });

      await expect.element(getGridItem(screen, 4)).toHaveFocus();
    });
  });
});
