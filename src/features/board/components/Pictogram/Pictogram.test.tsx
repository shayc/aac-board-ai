import { expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { Pictogram } from "./Pictogram";

test("renders image when src is provided", async () => {
  const screen = await render(
    <Pictogram src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />,
  );

  const image = screen.getByRole("img");
  await expect.element(image).toBeVisible();
});

test("renders label when label is provided", async () => {
  const screen = await render(<Pictogram label="Hello World" />);

  await expect.element(screen.getByText("Hello World")).toBeVisible();
});

test("renders both image and label when both are provided", async () => {
  const screen = await render(
    <Pictogram
      src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
      label="Test Label"
    />,
  );

  const image = screen.getByRole("img");
  await expect.element(image).toBeVisible();

  await expect.element(screen.getByText("Test Label")).toBeVisible();
});

test("applies custom typography variant to label", async () => {
  const screen = await render(
    <Pictogram label="Custom Typography" labelTypographyVariant="h6" />,
  );

  const label = screen.getByText("Custom Typography");
  await expect.element(label).toBeVisible();
});
