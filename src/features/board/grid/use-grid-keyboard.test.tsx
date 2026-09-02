import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent, type Locator } from "vitest/browser";
import { Grid, type GridItemProps } from "./grid";

interface TestItem {
  id: string;
  label: string;
}

function makeItems(...ids: number[]): TestItem[] {
  return ids.map((id) => ({ id: String(id), label: `Item ${id}` }));
}

function renderButton(item: TestItem, props: GridItemProps) {
  return <button {...props}>{item.label}</button>;
}

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

describe("useGridKeyboard", () => {
  describe("tab stops", () => {
    test("sets tabIndex so only the active cell is tabbable", async () => {
      const items = makeItems(1, 2, 3);

      const screen = await render(
        <Grid rows={1} columns={3} items={items} renderItem={renderButton} />,
      );

      const item1Button = screen.getByRole("button", { name: "Item 1" });
      const item2Button = screen.getByRole("button", { name: "Item 2" });
      const item3Button = screen.getByRole("button", { name: "Item 3" });

      await expect.element(item1Button).toHaveAttribute("tabindex", "0");
      await expect.element(item2Button).toHaveAttribute("tabindex", "-1");
      await expect.element(item3Button).toHaveAttribute("tabindex", "-1");
    });

    test("makes first non-empty cell tabbable when (0,0) is empty", async () => {
      const items = makeItems(1, 2);

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
          renderItem={renderButton}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      expect(getCellPosition(item2)).toEqual({ row: 0, col: 1 });
      expect(getCellPosition(item1)).toEqual({ row: 1, col: 0 });

      await expect.element(item2).toHaveAttribute("tabindex", "0");
      await expect.element(item1).toHaveAttribute("tabindex", "-1");
    });

    test("keeps a tab stop when the grid changes and the active cell becomes empty while focus is outside the grid", async () => {
      const oldItems = makeItems(1, 2, 3, 4);
      const newItems = makeItems(5);

      const screen = await render(
        <div>
          <button>Outside</button>
          <Grid
            rows={2}
            columns={2}
            items={oldItems}
            renderItem={renderButton}
          />
        </div>,
      );

      screen.getByRole("button", { name: "Item 4" }).element().focus();
      screen.getByRole("button", { name: "Outside" }).element().focus();

      await screen.rerender(
        <div>
          <button>Outside</button>
          <Grid
            rows={2}
            columns={2}
            items={newItems}
            renderItem={renderButton}
          />
        </div>,
      );

      const item5 = screen.getByRole("button", { name: "Item 5" });

      await expect.element(item5).toHaveAttribute("tabindex", "0");
    });
  });

  describe("arrow navigation", () => {
    test("moves focus with arrow keys to the next focusable cell", async () => {
      const items = makeItems(1, 2, 3, 4);

      const screen = await render(
        <Grid rows={2} columns={2} items={items} renderItem={renderButton} />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      await press(item1, "ArrowRight");

      await expect.element(item2).toHaveFocus();
    });

    test("falls back to the nearest diagonal cell when the arrow's line is empty", async () => {
      const items = makeItems(1, 2);

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
          renderItem={renderButton}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      await press(item1, "ArrowRight");

      await expect.element(item2).toHaveFocus();
    });

    test("prefers an in-line cell over a diagonal one", async () => {
      const items = makeItems(1, 2, 3);

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
          renderItem={renderButton}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      await press(item1, "ArrowRight");

      await expect.element(item2).toHaveFocus();
    });

    test("stays in place when no focusable cell exists in the arrow's direction", async () => {
      const items = makeItems(1);

      const screen = await render(
        <Grid rows={1} columns={2} items={items} renderItem={renderButton} />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });

      await press(item1, "ArrowDown");

      await expect.element(item1).toHaveFocus();
    });
  });

  describe("Home and End", () => {
    test("Home skips empty cells and lands on the first focusable cell in the row", async () => {
      const items = makeItems(2, 3);

      const order = [[null, "2", "3"]];

      const screen = await render(
        <Grid
          rows={1}
          columns={3}
          items={items}
          order={order}
          renderItem={renderButton}
        />,
      );

      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });

      await press(item3, "Home");

      await expect.element(item2).toHaveFocus();
    });

    test("End skips empty cells and lands on the last focusable cell in the row", async () => {
      const items = makeItems(1, 2);

      const order = [["1", "2", null]];

      const screen = await render(
        <Grid
          rows={1}
          columns={3}
          items={items}
          order={order}
          renderItem={renderButton}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      await press(item1, "End");

      await expect.element(item2).toHaveFocus();
    });

    test("Ctrl+Home focuses the first focusable cell in the grid even when (0,0) is empty", async () => {
      const items = makeItems(2, 3, 4);

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
          renderItem={renderButton}
        />,
      );

      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });
      const item4 = screen.getByRole("button", { name: "Item 4", exact: true });

      await press(item4, "Home", { ctrlKey: true });

      await expect.element(item2).toHaveFocus();
    });

    test("Ctrl+End focuses the last focusable cell in the grid even when the last cell is empty", async () => {
      const items = makeItems(1, 2, 3);

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
          renderItem={renderButton}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });

      await press(item1, "End", { ctrlKey: true });

      await expect.element(item3).toHaveFocus();
    });

    test("Meta+Home and Meta+End match the Ctrl behavior on macOS", async () => {
      const items = makeItems(1, 2, 3, 4);

      const screen = await render(
        <Grid rows={2} columns={2} items={items} renderItem={renderButton} />,
      );

      const item1 = screen.getByRole("button", {
        name: "Item 1",
        exact: true,
      });
      const item4 = screen.getByRole("button", {
        name: "Item 4",
        exact: true,
      });

      await press(item1, "End", { metaKey: true });
      await expect.element(item4).toHaveFocus();

      await press(item4, "Home", { metaKey: true });
      await expect.element(item1).toHaveFocus();
    });

    test("Shift+Home does not move focus", async () => {
      const items = makeItems(1, 2, 3);

      const screen = await render(
        <Grid rows={1} columns={3} items={items} renderItem={renderButton} />,
      );

      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });

      await press(item3, "Home", { shiftKey: true });

      await expect.element(item3).toHaveFocus();
    });
  });

  describe("right-to-left navigation", () => {
    test("ArrowRight moves to the previous column", async () => {
      const items = makeItems(1, 2);

      const screen = await render(
        <Grid
          rows={1}
          columns={2}
          items={items}
          dir="rtl"
          renderItem={renderButton}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      await press(item2, "ArrowRight");

      await expect.element(item1).toHaveFocus();
    });

    test("ArrowLeft moves to the next column", async () => {
      const items = makeItems(1, 2);

      const screen = await render(
        <Grid
          rows={1}
          columns={2}
          items={items}
          dir="rtl"
          renderItem={renderButton}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      await press(item1, "ArrowLeft");

      await expect.element(item2).toHaveFocus();
    });

    test("ArrowUp and ArrowDown are unaffected by direction", async () => {
      const items = makeItems(1, 2);

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
          renderItem={renderButton}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item2 = screen.getByRole("button", { name: "Item 2", exact: true });

      await press(item1, "ArrowDown");

      await expect.element(item2).toHaveFocus();
    });

    test("Home moves to the first cell in document order", async () => {
      const items = makeItems(1, 2, 3);

      const screen = await render(
        <Grid
          rows={1}
          columns={3}
          items={items}
          dir="rtl"
          renderItem={renderButton}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });

      await press(item3, "Home");

      await expect.element(item1).toHaveFocus();
    });

    test("End moves to the last cell in document order", async () => {
      const items = makeItems(1, 2, 3);

      const screen = await render(
        <Grid
          rows={1}
          columns={3}
          items={items}
          dir="rtl"
          renderItem={renderButton}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item3 = screen.getByRole("button", { name: "Item 3", exact: true });

      await press(item1, "End");

      await expect.element(item3).toHaveFocus();
    });

    test("Ctrl+Home moves to the first cell in document order", async () => {
      const items = makeItems(1, 2, 3, 4);

      const screen = await render(
        <Grid
          rows={2}
          columns={2}
          items={items}
          dir="rtl"
          renderItem={renderButton}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item4 = screen.getByRole("button", { name: "Item 4", exact: true });

      await press(item4, "Home", { ctrlKey: true });

      await expect.element(item1).toHaveFocus();
    });

    test("Ctrl+End moves to the last cell in document order", async () => {
      const items = makeItems(1, 2, 3, 4);

      const screen = await render(
        <Grid
          rows={2}
          columns={2}
          items={items}
          dir="rtl"
          renderItem={renderButton}
        />,
      );

      const item1 = screen.getByRole("button", { name: "Item 1", exact: true });
      const item4 = screen.getByRole("button", { name: "Item 4", exact: true });

      await press(item1, "End", { ctrlKey: true });

      await expect.element(item4).toHaveFocus();
    });
  });
});
