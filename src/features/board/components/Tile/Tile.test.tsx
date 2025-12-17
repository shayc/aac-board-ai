import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { Tile } from "./Tile";

test("renders label via Pictogram", async () => {
  const onClick = vi.fn();

  const screen = await render(<Tile label="Hello" onClick={onClick} />);

  await expect.element(screen.getByText("Hello")).toBeVisible();
});

test("renders image via Pictogram", async () => {
  const onClick = vi.fn();

  const screen = await render(
    <Tile imageSrc="test-image.png" label="Test" onClick={onClick} />,
  );

  const image = screen.getByRole("img");
  await expect.element(image).toHaveAttribute("src", "test-image.png");
});

test("calls onClick when clicked", async () => {
  const onClick = vi.fn();

  const screen = await render(<Tile label="Click me" onClick={onClick} />);

  const button = screen.getByRole("button");
  await button.click();

  expect(onClick).toHaveBeenCalledTimes(1);
});

test("does not call onClick when disabled", async () => {
  const onClick = vi.fn();

  const screen = await render(
    <Tile label="Disabled" disabled onClick={onClick} />,
  );

  const button = screen.getByRole("button");
  await expect.element(button).toBeDisabled();

  await button.click();

  expect(onClick).not.toHaveBeenCalled();
});
