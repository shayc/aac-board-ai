import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SuggestionBar } from "./SuggestionBar";

function createHandlers() {
  return {
    onSuggestionClick: vi.fn(),
    onToneChange: vi.fn(),
  };
}

test("renders a chip for each suggestion", async () => {
  const handlers = createHandlers();
  const suggestions = ["Hello", "How are you?", "Thank you"];

  const screen = await render(
    <SuggestionBar suggestions={suggestions} tone="as-is" {...handlers} />,
  );

  for (const suggestion of suggestions) {
    await expect
      .element(screen.getByRole("button", { name: suggestion }))
      .toBeVisible();
  }
});

test("clicking suggestion chips calls onSuggestionClick with correct values", async () => {
  const handlers = createHandlers();
  const suggestions = ["Hello", "Goodbye"];

  const screen = await render(
    <SuggestionBar suggestions={suggestions} tone="as-is" {...handlers} />,
  );

  const firstChip = screen.getByRole("button", { name: "Hello" });
  await firstChip.click();

  expect(handlers.onSuggestionClick).toHaveBeenCalledWith("Hello");
  expect(handlers.onSuggestionClick).toHaveBeenCalledTimes(1);

  const secondChip = screen.getByRole("button", { name: "Goodbye" });
  await secondChip.click();

  expect(handlers.onSuggestionClick).toHaveBeenCalledWith("Goodbye");
  expect(handlers.onSuggestionClick).toHaveBeenCalledTimes(2);
});

test("changing tone calls onToneChange with correct tone value", async () => {
  const handlers = createHandlers();

  const screen = await render(
    <SuggestionBar suggestions={["Hello"]} tone="as-is" {...handlers} />,
  );

  const casualButton = screen.getByRole("button", { name: "casual tone" });
  await casualButton.click();

  expect(handlers.onToneChange).toHaveBeenCalledWith("more-casual");
  expect(handlers.onToneChange).toHaveBeenCalledTimes(1);
});
