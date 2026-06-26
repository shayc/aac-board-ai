import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SuggestionBar, type SuggestionBarProps } from "./suggestion-bar";

function makeProps(
  overrides: Partial<SuggestionBarProps> = {},
): SuggestionBarProps {
  return {
    status: null,
    phrases: [],
    toneControlState: "enabled",
    tone: "as-is",
    onEnable: vi.fn(),
    onPhraseClick: vi.fn(),
    onToneChange: vi.fn(),
    ...overrides,
  };
}

describe("SuggestionBar", () => {
  test("renders a chip for each phrase", async () => {
    const phrases = ["Hello", "How are you?", "Thank you"];

    const screen = await render(<SuggestionBar {...makeProps({ phrases })} />);

    for (const phrase of phrases) {
      await expect
        .element(screen.getByRole("button", { name: phrase }))
        .toBeVisible();
    }
  });

  test("calls onPhraseClick with the correct value when a phrase chip is clicked", async () => {
    const props = makeProps({ phrases: ["Hello", "Goodbye"] });
    const screen = await render(<SuggestionBar {...props} />);

    await screen.getByRole("button", { name: "Hello" }).click();

    expect(props.onPhraseClick).toHaveBeenCalledWith("Hello");
    expect(props.onPhraseClick).toHaveBeenCalledTimes(1);

    await screen.getByRole("button", { name: "Goodbye" }).click();

    expect(props.onPhraseClick).toHaveBeenCalledWith("Goodbye");
    expect(props.onPhraseClick).toHaveBeenCalledTimes(2);
  });

  test("shows the tone selector when tone can be changed", async () => {
    const screen = await render(
      <SuggestionBar {...makeProps({ phrases: ["Hello"] })} />,
    );

    await expect
      .element(screen.getByRole("button", { name: "direct tone" }))
      .toBeVisible();
  });

  test("hides the tone selector when the tone control is hidden", async () => {
    const screen = await render(
      <SuggestionBar
        {...makeProps({ phrases: ["Hello"], toneControlState: "hidden" })}
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "direct tone" }))
      .not.toBeInTheDocument();
  });

  test("shows but disables the tone selector while the rewriter is not ready", async () => {
    const props = makeProps({
      phrases: ["Hello"],
      toneControlState: "disabled",
    });
    const screen = await render(<SuggestionBar {...props} />);

    const professional = screen.getByRole("button", {
      name: "professional tone",
    });
    await expect.element(professional).toBeVisible();
    await expect.element(professional).toBeDisabled();
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

  test("announces unavailability after a failed request", async () => {
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
        {...makeProps({ phrases: ["Hello", "How are you?", "Thank you"] })}
      />,
    );

    await expectNoA11yViolations(screen.container);
  });
});
