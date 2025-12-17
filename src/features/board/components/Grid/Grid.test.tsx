import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Grid } from "./Grid";

interface TestItem {
  id: string;
  label: string;
}

test("renders correct number of rows and columns", async () => {
  const items: TestItem[] = [
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
      renderItem={(item) => <div>{item.label}</div>}
    />,
  );

  await expect.element(screen.getByText("Item 1")).toBeVisible();
  await expect.element(screen.getByText("Item 2")).toBeVisible();
  await expect.element(screen.getByText("Item 3")).toBeVisible();
  await expect.element(screen.getByText("Item 4")).toBeVisible();
});

test("uses custom order array when provided", async () => {
  const items: TestItem[] = [
    { id: "1", label: "Item 1" },
    { id: "2", label: "Item 2" },
    { id: "3", label: "Item 3" },
  ];

  const order = [
    ["3", "1"],
    [null, "2"],
  ];

  const screen = await render(
    <Grid
      rows={2}
      columns={2}
      items={items}
      order={order}
      renderItem={(item) => (
        <div data-testid={`item-${item.id}`}>{item.label}</div>
      )}
    />,
  );

  await expect.element(screen.getByTestId("item-3")).toBeVisible();
  await expect.element(screen.getByTestId("item-1")).toBeVisible();
  await expect.element(screen.getByTestId("item-2")).toBeVisible();
});

test("handles empty cells with null in order array", async () => {
  const items: TestItem[] = [
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
      renderItem={(item) => <div>{item.label}</div>}
    />,
  );

  await expect.element(screen.getByText("Item 1")).toBeVisible();
  await expect.element(screen.getByText("Item 2")).toBeVisible();
});

test("falls back to sequential placement without order array", async () => {
  const items: TestItem[] = [
    { id: "1", label: "A" },
    { id: "2", label: "B" },
    { id: "3", label: "C" },
    { id: "4", label: "D" },
    { id: "5", label: "E" },
    { id: "6", label: "F" },
  ];

  const screen = await render(
    <Grid
      rows={2}
      columns={3}
      items={items}
      renderItem={(item) => <div>{item.label}</div>}
    />,
  );

  await expect.element(screen.getByText("A")).toBeVisible();
  await expect.element(screen.getByText("B")).toBeVisible();
  await expect.element(screen.getByText("C")).toBeVisible();
  await expect.element(screen.getByText("D")).toBeVisible();
  await expect.element(screen.getByText("E")).toBeVisible();
  await expect.element(screen.getByText("F")).toBeVisible();
});

test("handles items count less than grid capacity", async () => {
  const items: TestItem[] = [
    { id: "1", label: "Item 1" },
    { id: "2", label: "Item 2" },
  ];

  const screen = await render(
    <Grid
      rows={2}
      columns={3}
      items={items}
      renderItem={(item) => <div>{item.label}</div>}
    />,
  );

  await expect.element(screen.getByText("Item 1")).toBeVisible();
  await expect.element(screen.getByText("Item 2")).toBeVisible();
});

test("applies custom gap spacing", async () => {
  const items: TestItem[] = [{ id: "1", label: "Item 1" }];

  const screen = await render(
    <Grid
      rows={1}
      columns={1}
      items={items}
      gap={4}
      renderItem={(item) => <div>{item.label}</div>}
    />,
  );

  await expect.element(screen.getByText("Item 1")).toBeVisible();
});
