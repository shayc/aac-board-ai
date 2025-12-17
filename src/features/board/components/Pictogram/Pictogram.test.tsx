import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Pictogram } from "./Pictogram";

test("renders image and label", async () => {
  const screen = await render(<Pictogram label="Hello" />);

  await expect.element(screen.getByText("Hello")).toBeVisible();
});
