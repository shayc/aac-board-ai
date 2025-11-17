import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SuggestionBar } from "./SuggestionBar";

test("renders multiple suggestion chips", async () => {
  const onSuggestionClick = vi.fn();
  const onToneChange = vi.fn();
  const suggestions = ["Hello", "How are you?", "Thank you"];

  const screen = await render(
    <SuggestionBar
      suggestions={suggestions}
      tone="as-is"
      onToneChange={onToneChange}
      onSuggestionClick={onSuggestionClick}
    />,
  );

  await expect.element(screen.getByText("Hello")).toBeVisible();
  await expect.element(screen.getByText("How are you?")).toBeVisible();
  await expect.element(screen.getByText("Thank you")).toBeVisible();
});

test("clicking suggestion chips calls onSuggestionClick with correct values", async () => {
  const onSuggestionClick = vi.fn();
  const onToneChange = vi.fn();
  const suggestions = ["Hello", "Goodbye"];

  const screen = await render(
    <SuggestionBar
      suggestions={suggestions}
      tone="as-is"
      onToneChange={onToneChange}
      onSuggestionClick={onSuggestionClick}
    />,
  );

  const firstChip = screen.getByText("Hello");
  await firstChip.click();

  expect(onSuggestionClick).toHaveBeenCalledWith("Hello");
  expect(onSuggestionClick).toHaveBeenCalledTimes(1);

  const secondChip = screen.getByText("Goodbye");
  await secondChip.click();

  expect(onSuggestionClick).toHaveBeenCalledWith("Goodbye");
  expect(onSuggestionClick).toHaveBeenCalledTimes(2);
});

test("passes tone prop to ToneSelector", async () => {
  const onSuggestionClick = vi.fn();
  const onToneChange = vi.fn();

  const screen = await render(
    <SuggestionBar
      suggestions={["Hello"]}
      tone="more-formal"
      onToneChange={onToneChange}
      onSuggestionClick={onSuggestionClick}
    />,
  );

  const formalButton = screen.getByLabelText("formal tone");
  await expect.element(formalButton).toHaveAttribute("aria-pressed", "true");
});

test("changing tone calls onToneChange with correct tone value", async () => {
  const onSuggestionClick = vi.fn();
  const onToneChange = vi.fn();

  const screen = await render(
    <SuggestionBar
      suggestions={["Hello"]}
      tone="as-is"
      onToneChange={onToneChange}
      onSuggestionClick={onSuggestionClick}
    />,
  );

  const casualButton = screen.getByLabelText("casual tone");
  await casualButton.click();

  expect(onToneChange).toHaveBeenCalledWith("more-casual");
  expect(onToneChange).toHaveBeenCalledTimes(1);
});

test("renders ToneSelector when suggestions array is empty", async () => {
  const onSuggestionClick = vi.fn();
  const onToneChange = vi.fn();

  const screen = await render(
    <SuggestionBar
      suggestions={[]}
      tone="as-is"
      onToneChange={onToneChange}
      onSuggestionClick={onSuggestionClick}
    />,
  );

  const neutralButton = screen.getByLabelText("neutral tone");
  const formalButton = screen.getByLabelText("formal tone");
  const casualButton = screen.getByLabelText("casual tone");

  await expect.element(neutralButton).toBeVisible();
  await expect.element(formalButton).toBeVisible();
  await expect.element(casualButton).toBeVisible();
});
