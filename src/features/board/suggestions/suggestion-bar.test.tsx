import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import type { ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SuggestionBar, type SuggestionBarProps } from "./suggestion-bar";

function renderWithProviders(children: ReactNode) {
  return render(<AppProviders>{children}</AppProviders>);
}

function makeProps(
  overrides: Partial<SuggestionBarProps> = {},
): SuggestionBarProps {
  return {
    status: null,
    phrases: [],
    onEnable: vi.fn(),
    onPhraseClick: vi.fn(),
    ...overrides,
  };
}

describe("SuggestionBar", () => {
  test("renders a chip for each phrase", async () => {
    const phrases = ["Hello", "How are you?", "Thank you"];

    const screen = await renderWithProviders(
      <SuggestionBar {...makeProps({ phrases })} />,
    );

    for (const phrase of phrases) {
      await expect
        .element(screen.getByRole("button", { name: phrase }))
        .toBeVisible();
    }
  });

  test("calls onPhraseClick with the correct value when a phrase chip is clicked", async () => {
    const props = makeProps({ phrases: ["Hello", "Goodbye"] });
    const screen = await renderWithProviders(<SuggestionBar {...props} />);

    await screen.getByRole("button", { name: "Hello" }).click();

    expect(props.onPhraseClick).toHaveBeenCalledWith("Hello");
    expect(props.onPhraseClick).toHaveBeenCalledTimes(1);

    await screen.getByRole("button", { name: "Goodbye" }).click();

    expect(props.onPhraseClick).toHaveBeenCalledWith("Goodbye");
    expect(props.onPhraseClick).toHaveBeenCalledTimes(2);
  });

  test("offers an enable chip when activation is needed", async () => {
    const props = makeProps({ status: { kind: "needs-activation" } });
    const screen = await renderWithProviders(<SuggestionBar {...props} />);

    await screen.getByRole("button", { name: "Enable suggestions" }).click();

    expect(props.onEnable).toHaveBeenCalledOnce();
  });

  test("shows download progress while the model downloads", async () => {
    const screen = await renderWithProviders(
      <SuggestionBar
        {...makeProps({ status: { kind: "downloading", percent: 43 } })}
      />,
    );

    await expect
      .element(screen.getByText("Downloading AI model... 43%"))
      .toBeVisible();
  });

  test("shows a percentless download message while progress is unknown", async () => {
    const screen = await renderWithProviders(
      <SuggestionBar
        {...makeProps({ status: { kind: "downloading", percent: null } })}
      />,
    );

    await expect
      .element(screen.getByText("Downloading AI model...", { exact: true }))
      .toBeVisible();
  });

  test("announces unavailability after a failed request", async () => {
    const screen = await renderWithProviders(
      <SuggestionBar {...makeProps({ status: { kind: "unavailable" } })} />,
    );

    await expect
      .element(screen.getByText("Suggestions unavailable"))
      .toBeVisible();

    await expectNoA11yViolations(screen.container);
  });

  test("has no accessibility violations", async () => {
    const screen = await renderWithProviders(
      <SuggestionBar
        {...makeProps({ phrases: ["Hello", "How are you?", "Thank you"] })}
      />,
    );

    await expectNoA11yViolations(screen.container);
  });
});
