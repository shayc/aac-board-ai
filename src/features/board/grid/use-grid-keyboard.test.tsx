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

describe("useGridKeyboard", () => {
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

  test("keeps a tab stop when the grid changes and the active cell becomes empty while focus is outside the grid", async () => {
    const renderItem = (
      item: { id: string; label: string },
      props: { tabIndex: number },
    ) => <button {...props}>{item.label}</button>;

    const oldItems = [
      { id: "1", label: "Item 1" },
      { id: "2", label: "Item 2" },
      { id: "3", label: "Item 3" },
      { id: "4", label: "Item 4" },
    ];
    const newItems = [{ id: "5", label: "Item 5" }];

    const screen = await render(
      <div>
        <button>Outside</button>
        <Grid rows={2} columns={2} items={oldItems} renderItem={renderItem} />
      </div>,
    );

    screen.getByRole("button", { name: "Item 4" }).element().focus();
    screen.getByRole("button", { name: "Outside" }).element().focus();

    await screen.rerender(
      <div>
        <button>Outside</button>
        <Grid rows={2} columns={2} items={newItems} renderItem={renderItem} />
      </div>,
    );

    const item5 = screen.getByRole("button", { name: "Item 5" });

    await expect.element(item5).toHaveAttribute("tabindex", "0");
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
          renderItem={(item, props) => <button {...props}>{item.label}</button>}
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

    await press(item4, "End", { ctrlKey: true });

    await expect.element(item1).toHaveFocus();
  });
});
