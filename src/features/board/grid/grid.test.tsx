import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent, type Locator } from "vitest/browser";
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

      await expect.element(item1Button).toHaveAttribute("tabindex", "0");
      await expect.element(item2Button).toHaveAttribute("tabindex", "-1");
      await expect.element(item3Button).toHaveAttribute("tabindex", "-1");
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

      await expect.element(item2).toHaveAttribute("tabindex", "0");
      await expect.element(item1).toHaveAttribute("tabindex", "-1");
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

      await press(item1, "ArrowRight");

      await expect.element(item2).toHaveFocus();
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

      await press(item1, "ArrowRight");

      await expect.element(item2).toHaveFocus();
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

      await press(item1, "ArrowRight");

      await expect.element(item2).toHaveFocus();
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

      await press(item1, "ArrowDown");

      await expect.element(item1).toHaveFocus();
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

      await press(item3, "Home");

      await expect.element(item1).toHaveFocus();
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

      await press(item1, "End");

      await expect.element(item3).toHaveFocus();
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

      await press(item3, "Home");

      await expect.element(item2).toHaveFocus();
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

      await press(item1, "End");

      await expect.element(item2).toHaveFocus();
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

      await press(item4, "Home", { ctrlKey: true });

      await expect.element(item2).toHaveFocus();
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

      await press(item1, "End", { ctrlKey: true });

      await expect.element(item3).toHaveFocus();
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

        await press(item1, "End", { [modifier]: true });
        await expect.element(item4).toHaveFocus();

        item4.element().focus();
        await expect.element(item4).toHaveFocus();

        await press(item4, "Home", { [modifier]: true });
        await expect.element(item1).toHaveFocus();
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

      await press(item3, "Home", { shiftKey: true });

      await expect.element(item3).toHaveFocus();
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

      await press(item2, "ArrowRight");

      await expect.element(item1).toHaveFocus();
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

      await press(item1, "ArrowLeft");

      await expect.element(item2).toHaveFocus();
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

      await press(item1, "ArrowDown");

      await expect.element(item2).toHaveFocus();
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

      // In RTL, Item 1 (col 0) is visually rightmost and Item 3 (col 2) is
      // visually leftmost. macOS sends Home for Fn+ArrowLeft, so Home should
      // move toward the visual left to stay consistent with ArrowLeft.
      item1.element().focus();
      await expect.element(item1).toHaveFocus();

      await press(item1, "Home");

      await expect.element(item3).toHaveFocus();
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

      // End (Fn+ArrowRight on macOS) mirrors ArrowRight: moves toward the
      // visual right, which is col 0 (Item 1) in RTL.
      item3.element().focus();
      await expect.element(item3).toHaveFocus();

      await press(item3, "End");

      await expect.element(item1).toHaveFocus();
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

      // macOS Fn+Ctrl+ArrowLeft sends Ctrl+Home. Because ArrowLeft is the
      // forward/end direction in RTL, Ctrl+Home jumps to the last cell in
      // reading order — row max / col max — which is visually bottom-left.
      await press(item1, "Home", { ctrlKey: true });

      await expect.element(item4).toHaveFocus();
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

      // macOS Fn+Ctrl+ArrowRight sends Ctrl+End. ArrowRight is the
      // backward/start direction in RTL, so Ctrl+End jumps to the first
      // cell in reading order — row 0 / col 0 — which is visually top-right.
      await press(item4, "End", { ctrlKey: true });

      await expect.element(item1).toHaveFocus();
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
});
