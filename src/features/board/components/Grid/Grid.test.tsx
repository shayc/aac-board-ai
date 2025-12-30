import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import type { Locator } from "@vitest/browser/context";
import { Grid } from "./Grid";

function getCellPosition(item: Locator): { row: number; col: number } {
  const cell = item.element().closest("[data-grid-cell]");
  if (!cell) {
    throw new Error("Item is not inside a grid cell");
  }
  const row = parseInt(cell.getAttribute("data-row") ?? "", 10);
  const col = parseInt(cell.getAttribute("data-col") ?? "", 10);
  if (isNaN(row) || isNaN(col)) {
    throw new Error("Grid cell missing valid data-row or data-col");
  }
  return { row, col };
}

describe("Grid", () => {
  describe("default grid construction (no order)", () => {
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

      await expect.element(item1).toBeVisible();
      await expect.element(item4).toBeVisible();
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

      await expect
        .element(screen.getByRole("button", { name: "Item 1", exact: true }))
        .toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: "Item 4", exact: true }))
        .toBeVisible();

      expect(
        screen.getByRole("button", { name: "Item 5", exact: true }).query(),
      ).toBeNull();
    });
  });

  describe("ordered grid construction", () => {
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

      await expect
        .element(screen.getByRole("button", { name: "Item 1", exact: true }))
        .toBeVisible();
      await expect
        .element(screen.getByRole("button", { name: "Item 2", exact: true }))
        .toBeVisible();
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

      await expect.element(item1Button).toHaveAttribute("tabindex", "0");
      await expect.element(item2Button).toHaveAttribute("tabindex", "-1");
      await expect.element(item3Button).toHaveAttribute("tabindex", "-1");
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

    test("does not move focus into empty cells", async () => {
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

      const item1El = item1.element();
      item1El.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }),
      );

      await expect
        .poll(() => document.activeElement === item1.element())
        .toBe(true);

      item1El.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
      await expect
        .poll(() => document.activeElement === item1.element())
        .toBe(true);

      item2.element().focus();
      const item2El = item2.element();
      item2El.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }),
      );

      await expect
        .poll(() => document.activeElement === item2.element())
        .toBe(true);
    });
  });
});
