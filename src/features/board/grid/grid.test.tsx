import type { Locator } from "@vitest/browser/context";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Grid } from "./grid";

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

function press(item: Locator, key: string, modifiers: KeyboardEventInit = {}) {
  item
    .element()
    .dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, ...modifiers }),
    );
}

function expectFocus(item: Locator) {
  return expect
    .poll(() => document.activeElement === item.element())
    .toBe(true);
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

  describe("keyboard/focus behavior", () => {
    test("sets tabIndex so only the active cell is tabbable", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
        { id: "3", label: "Item 3" },
      ];

      const screen = await render(
        <Grid
          rows={1}
          columns={3}
          items={items}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1Button = screen.getByRole("button", { name: "Item 1" });
      const item2Button = screen.getByRole("button", { name: "Item 2" });
      const item3Button = screen.getByRole("button", { name: "Item 3" });

      await expect
        .poll(() => item1Button.element().getAttribute("tabindex"))
        .toBe("0");
      await expect
        .poll(() => item2Button.element().getAttribute("tabindex"))
        .toBe("-1");
      await expect
        .poll(() => item3Button.element().getAttribute("tabindex"))
        .toBe("-1");
    });

    test("makes first non-empty cell tabbable when (0,0) is empty", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
      ];

      const order = [
        [null, "2"],
        ["1", null],
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

      expect(getCellPosition(item2)).toEqual({ row: 0, col: 1 });
      expect(getCellPosition(item1)).toEqual({ row: 1, col: 0 });

      await expect
        .poll(() => item2.element().getAttribute("tabindex"))
        .toBe("0");
      await expect
        .poll(() => item1.element().getAttribute("tabindex"))
        .toBe("-1");
    });

    test("moves focus with arrow keys to the next focusable cell", async () => {
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

      item1.element().focus();
      await expect.element(item1).toHaveFocus();

      const item1El = item1.element();
      item1El.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );

      await expect
        .poll(() => document.activeElement === item2.element())
        .toBe(true);
    });

    test("falls back to the nearest diagonal cell when the arrow's line is empty", async () => {
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

      item1.element().focus();
      await expect.element(item1).toHaveFocus();

      item1
        .element()
        .dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );

      await expect
        .poll(() => document.activeElement === item2.element())
        .toBe(true);
    });

    test("prefers an in-line cell over a diagonal one", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
        { id: "3", label: "Item 3" },
      ];

      const order = [
        ["1", "2", null],
        [null, null, "3"],
      ];

      const screen = await render(
        <Grid
          rows={2}
          columns={3}
          items={items}
          order={order}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      item1.element().focus();
      await expect.element(item1).toHaveFocus();

      item1
        .element()
        .dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
        );

      await expect
        .poll(() => document.activeElement === item2.element())
        .toBe(true);
    });

    test("stays in place when no focusable cell exists in the arrow's direction", async () => {
      const items = [{ id: "1", label: "Item 1" }];

      const screen = await render(
        <Grid
          rows={1}
          columns={2}
          items={items}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });

      item1.element().focus();
      await expect.element(item1).toHaveFocus();

      item1
        .element()
        .dispatchEvent(
          new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
        );

      await expect
        .poll(() => document.activeElement === item1.element())
        .toBe(true);
    });

    test("Home moves focus to the first focusable cell in the current row", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
        { id: "3", label: "Item 3" },
      ];

      const screen = await render(
        <Grid
          rows={1}
          columns={3}
          items={items}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });

      item3.element().focus();
      await expect.element(item3).toHaveFocus();

      press(item3, "Home");

      await expectFocus(item1);
    });

    test("End moves focus to the last focusable cell in the current row", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
        { id: "3", label: "Item 3" },
      ];

      const screen = await render(
        <Grid
          rows={1}
          columns={3}
          items={items}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });

      item1.element().focus();
      await expect.element(item1).toHaveFocus();

      press(item1, "End");

      await expectFocus(item3);
    });

    test("Home skips empty cells and lands on the first focusable cell in the row", async () => {
      const items = [
        { id: "2", label: "Item 2" },
        { id: "3", label: "Item 3" },
      ];

      const order = [[null, "2", "3"]];

      const screen = await render(
        <Grid
          rows={1}
          columns={3}
          items={items}
          order={order}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });

      item3.element().focus();
      await expect.element(item3).toHaveFocus();

      press(item3, "Home");

      await expectFocus(item2);
    });

    test("End skips empty cells and lands on the last focusable cell in the row", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
      ];

      const order = [["1", "2", null]];

      const screen = await render(
        <Grid
          rows={1}
          columns={3}
          items={items}
          order={order}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      item1.element().focus();
      await expect.element(item1).toHaveFocus();

      press(item1, "End");

      await expectFocus(item2);
    });

    test("Ctrl+Home focuses the first focusable cell in the grid even when (0,0) is empty", async () => {
      const items = [
        { id: "2", label: "Item 2" },
        { id: "3", label: "Item 3" },
        { id: "4", label: "Item 4" },
      ];

      const order = [
        [null, "2"],
        ["3", "4"],
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

      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });
      const item4 = screen.getByRole("button", { name: "Item 4", exact: true });

      item4.element().focus();
      await expect.element(item4).toHaveFocus();

      press(item4, "Home", { ctrlKey: true });

      await expectFocus(item2);
    });

    test("Ctrl+End focuses the last focusable cell in the grid even when the last cell is empty", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
        { id: "3", label: "Item 3" },
      ];

      const order = [
        ["1", "2"],
        ["3", null],
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
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });

      item1.element().focus();
      await expect.element(item1).toHaveFocus();

      press(item1, "End", { ctrlKey: true });

      await expectFocus(item3);
    });

    test.each([
      { modifier: "ctrlKey" as const, label: "Ctrl" },
      { modifier: "metaKey" as const, label: "Meta" },
    ])(
      "$label+Home and $label+End behave identically (macOS parity)",
      async ({ modifier }) => {
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
            renderItem={(item, props) => (
              <button {...props}>{item.label}</button>
            )}
          />,
        );

        const item1 = screen.getByRole("button", {
          name: "Item 1",
          exact: true,
        });
        const item4 = screen.getByRole("button", {
          name: "Item 4",
          exact: true,
        });

        item1.element().focus();
        await expect.element(item1).toHaveFocus();

        press(item1, "End", { [modifier]: true });
        await expectFocus(item4);

        item4.element().focus();
        await expect.element(item4).toHaveFocus();

        press(item4, "Home", { [modifier]: true });
        await expectFocus(item1);
      },
    );

    test("Shift+Home does not move focus", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
        { id: "3", label: "Item 3" },
      ];

      const screen = await render(
        <Grid
          rows={1}
          columns={3}
          items={items}
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });

      item3.element().focus();
      await expect.element(item3).toHaveFocus();

      press(item3, "Home", { shiftKey: true });

      await expectFocus(item3);
    });

    test("RTL: ArrowRight moves to the previous column", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
      ];

      const screen = await render(
        <Grid
          rows={1}
          columns={2}
          items={items}
          dir="rtl"
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      item2.element().focus();
      await expect.element(item2).toHaveFocus();

      press(item2, "ArrowRight");

      await expectFocus(item1);
    });

    test("RTL: ArrowLeft moves to the next column", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
      ];

      const screen = await render(
        <Grid
          rows={1}
          columns={2}
          items={items}
          dir="rtl"
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      item1.element().focus();
      await expect.element(item1).toHaveFocus();

      press(item1, "ArrowLeft");

      await expectFocus(item2);
    });

    test("RTL: ArrowUp and ArrowDown are unaffected by direction", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
      ];

      const order = [
        ["1", null],
        ["2", null],
      ];

      const screen = await render(
        <Grid
          rows={2}
          columns={2}
          items={items}
          order={order}
          dir="rtl"
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      item1.element().focus();
      await expect.element(item1).toHaveFocus();

      press(item1, "ArrowDown");

      await expectFocus(item2);
    });

    test("RTL: Home moves to the visually-left edge (highest aria-colindex)", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
        { id: "3", label: "Item 3" },
      ];

      const screen = await render(
        <Grid
          rows={1}
          columns={3}
          items={items}
          dir="rtl"
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });

      item1.element().focus();
      await expect.element(item1).toHaveFocus();

      press(item1, "Home");

      await expectFocus(item3);
    });

    test("RTL: End moves to the visually-right edge (lowest aria-colindex)", async () => {
      const items = [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
        { id: "3", label: "Item 3" },
      ];

      const screen = await render(
        <Grid
          rows={1}
          columns={3}
          items={items}
          dir="rtl"
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });

      item3.element().focus();
      await expect.element(item3).toHaveFocus();

      press(item3, "End");

      await expectFocus(item1);
    });

    test("RTL: Ctrl+Home moves to the visually bottom-left cell of the grid", async () => {
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
          dir="rtl"
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item4 = screen.getByRole("button", { name: "Item 4", exact: true });

      item1.element().focus();
      await expect.element(item1).toHaveFocus();

      press(item1, "Home", { ctrlKey: true });

      await expectFocus(item4);
    });

    test("RTL: Ctrl+End moves to the visually top-right cell of the grid", async () => {
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
          dir="rtl"
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item4 = screen.getByRole("button", { name: "Item 4", exact: true });

      item4.element().focus();
      await expect.element(item4).toHaveFocus();

      press(item4, "End", { ctrlKey: true });

      await expectFocus(item1);
    });

    test("Grid forwards dir prop to the root element", async () => {
      const items = [{ id: "1", label: "Item 1" }];

      const screen = await render(
        <Grid
          rows={1}
          columns={1}
          items={items}
          dir="rtl"
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
        />,
      );

      const grid = screen.getByRole("grid");
      await expect.element(grid).toHaveAttribute("dir", "rtl");
    });
  });
});
