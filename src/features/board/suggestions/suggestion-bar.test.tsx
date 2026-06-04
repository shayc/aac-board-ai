import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SuggestionBar } from "./suggestion-bar";

function createHandlers() {
  return {
    onSuggestionClick: vi.fn(),
    onToneChange: vi.fn(),
  };
}

describe("SuggestionBar", () => {
  test("renders a chip for each suggestion", async () => {
    const handlers = createHandlers();
    const suggestions = ["Hello", "How are you?", "Thank you"];

    const screen = await render(
      <SuggestionBar
        suggestions={suggestions}
        tone="as-is"
        canChangeTone
        {...handlers}
      />,
    );

    for (const suggestion of suggestions) {
      await expect
        .element(screen.getByRole("button", { name: suggestion }))
        .toBeVisible();
    }
  });

  test("calls onSuggestionClick with the correct value when a suggestion chip is clicked", async () => {
    const handlers = createHandlers();
    const suggestions = ["Hello", "Goodbye"];

    const screen = await render(
      <SuggestionBar
        suggestions={suggestions}
        tone="as-is"
        canChangeTone
        {...handlers}
      />,
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

  test("shows the tone selector when tone can be changed", async () => {
    const handlers = createHandlers();

    const screen = await render(
      <SuggestionBar
        suggestions={["Hello"]}
        tone="as-is"
        canChangeTone
        {...handlers}
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "direct tone" }))
      .toBeVisible();
  });

  test("hides the tone selector when tone cannot be changed", async () => {
    const handlers = createHandlers();

    const screen = await render(
      <SuggestionBar
        suggestions={["Hello"]}
        tone="as-is"
        canChangeTone={false}
        {...handlers}
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "direct tone" }))
      .not.toBeInTheDocument();
  });

  test("has no accessibility violations", async () => {
    const handlers = createHandlers();

    const screen = await render(
      <SuggestionBar
        suggestions={["Hello", "How are you?", "Thank you"]}
        tone="as-is"
        canChangeTone
        {...handlers}
      />,
    );

    await expectNoA11yViolations(screen.container);
  });
});
