import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Grid } from "./Grid";

test("renders items in grid", async () => {
  const items = [
    { id: "1", label: "Item 1" },
    { id: "2", label: "Item 2" },
  ];

  const screen = await render(
    <Grid
      rows={1}
      columns={2}
      items={items}
      renderItem={(item) => <div>{item.label}</div>}
    />,
  );

  await expect.element(screen.getByText("Item 1")).toBeVisible();
  await expect.element(screen.getByText("Item 2")).toBeVisible();
});
