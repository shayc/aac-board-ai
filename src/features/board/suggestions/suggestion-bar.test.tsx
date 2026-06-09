import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SuggestionBar, type SuggestionBarProps } from "./suggestion-bar";

function makeProps(
  overrides: Partial<SuggestionBarProps> = {},
): SuggestionBarProps {
  return {
    suggestions: [],
    status: null,
    tone: "as-is",
    canChangeTone: true,
    onSuggestionClick: vi.fn(),
    onToneChange: vi.fn(),
    onEnable: vi.fn(),
    ...overrides,
  };
}

describe("SuggestionBar", () => {
  test("renders a chip for each suggestion", async () => {
    const suggestions = ["Hello", "How are you?", "Thank you"];

    const screen = await render(
      <SuggestionBar {...makeProps({ suggestions })} />,
    );

    for (const suggestion of suggestions) {
      await expect
        .element(screen.getByRole("button", { name: suggestion }))
        .toBeVisible();
    }
  });

  test("calls onSuggestionClick with the correct value when a suggestion chip is clicked", async () => {
    const props = makeProps({ suggestions: ["Hello", "Goodbye"] });
    const screen = await render(<SuggestionBar {...props} />);

    await screen.getByRole("button", { name: "Hello" }).click();

    expect(props.onSuggestionClick).toHaveBeenCalledWith("Hello");
    expect(props.onSuggestionClick).toHaveBeenCalledTimes(1);

    await screen.getByRole("button", { name: "Goodbye" }).click();

    expect(props.onSuggestionClick).toHaveBeenCalledWith("Goodbye");
    expect(props.onSuggestionClick).toHaveBeenCalledTimes(2);
  });

  test("shows the tone selector when tone can be changed", async () => {
    const screen = await render(
      <SuggestionBar {...makeProps({ suggestions: ["Hello"] })} />,
    );

    await expect
      .element(screen.getByRole("button", { name: "direct tone" }))
      .toBeVisible();
  });

  test("hides the tone selector when tone cannot be changed", async () => {
    const screen = await render(
      <SuggestionBar
        {...makeProps({ suggestions: ["Hello"], canChangeTone: false })}
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "direct tone" }))
      .not.toBeInTheDocument();
  });

  test("offers an enable chip when activation is needed", async () => {
    const props = makeProps({ status: { kind: "needs-activation" } });
    const screen = await render(<SuggestionBar {...props} />);

    await screen.getByRole("button", { name: "Enable suggestions" }).click();

    expect(props.onEnable).toHaveBeenCalledOnce();
  });

  test("shows download progress while the model downloads", async () => {
    const screen = await render(
      <SuggestionBar
        {...makeProps({ status: { kind: "downloading", progress: 0.43 } })}
      />,
    );

    await expect
      .element(screen.getByText("Downloading AI model… 43%"))
      .toBeVisible();
  });

  test("announces unavailability after a failed round", async () => {
    const screen = await render(
      <SuggestionBar {...makeProps({ status: { kind: "unavailable" } })} />,
    );

    await expect
      .element(screen.getByText("Suggestions unavailable"))
      .toBeVisible();

    await expectNoA11yViolations(screen.container);
  });

  test("has no accessibility violations", async () => {
    const screen = await render(
      <SuggestionBar
        {...makeProps({ suggestions: ["Hello", "How are you?", "Thank you"] })}
      />,
    );

    await expectNoA11yViolations(screen.container);
  });
});
