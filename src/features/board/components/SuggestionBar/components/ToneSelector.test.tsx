import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { ToneSelector } from "./ToneSelector";

test("renders all three tone options", async () => {
  const onChange = vi.fn();

  const screen = await render(
    <ToneSelector tone="as-is" onChange={onChange} />,
  );

  await expect
    .element(screen.getByRole("button", { name: "neutral tone" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "formal tone" }))
    .toBeVisible();
  await expect
    .element(screen.getByRole("button", { name: "casual tone" }))
    .toBeVisible();
});

test("highlights neutral tone when selected", async () => {
  const onChange = vi.fn();

  const screen = await render(
    <ToneSelector tone="as-is" onChange={onChange} />,
  );

  const neutralButton = screen.getByRole("button", { name: "neutral tone" });
  await expect.element(neutralButton).toHaveAttribute("aria-pressed", "true");
});

test("highlights formal tone when selected", async () => {
  const onChange = vi.fn();

  const screen = await render(
    <ToneSelector tone="more-formal" onChange={onChange} />,
  );

  const formalButton = screen.getByRole("button", { name: "formal tone" });
  await expect.element(formalButton).toHaveAttribute("aria-pressed", "true");
});

test("highlights casual tone when selected", async () => {
  const onChange = vi.fn();

  const screen = await render(
    <ToneSelector tone="more-casual" onChange={onChange} />,
  );

  const casualButton = screen.getByRole("button", { name: "casual tone" });
  await expect.element(casualButton).toHaveAttribute("aria-pressed", "true");
});

test("calls onChange with new tone when selection changes", async () => {
  const onChange = vi.fn();

  const screen = await render(
    <ToneSelector tone="as-is" onChange={onChange} />,
  );

  const formalButton = screen.getByRole("button", { name: "formal tone" });
  await formalButton.click();

  expect(onChange).toHaveBeenCalledWith("more-formal");
  expect(onChange).toHaveBeenCalledTimes(1);
});

test("does not call onChange when clicking already selected tone", async () => {
  const onChange = vi.fn();

  const screen = await render(
    <ToneSelector tone="as-is" onChange={onChange} />,
  );

  const neutralButton = screen.getByRole("button", { name: "neutral tone" });
  await neutralButton.click();

  expect(onChange).not.toHaveBeenCalled();
});

test("allows changing between different tones", async () => {
  const onChange = vi.fn();

  const screen = await render(
    <ToneSelector tone="as-is" onChange={onChange} />,
  );

  const formalButton = screen.getByRole("button", { name: "formal tone" });
  await formalButton.click();

  expect(onChange).toHaveBeenCalledWith("more-formal");

  const casualButton = screen.getByRole("button", { name: "casual tone" });
  await casualButton.click();

  expect(onChange).toHaveBeenCalledWith("more-casual");
  expect(onChange).toHaveBeenCalledTimes(2);
});

test("defaults to neutral tone when no tone prop provided", async () => {
  const onChange = vi.fn();

  const screen = await render(
    <ToneSelector tone="as-is" onChange={onChange} />,
  );

  const neutralButton = screen.getByRole("button", { name: "neutral tone" });
  await expect.element(neutralButton).toHaveAttribute("aria-pressed", "true");
});
