import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { describe, expect, test, vi } from "vitest";
import { SuggestionBar, type SuggestionBarProps } from "./suggestion-bar";

function makeProps(
  overrides: Partial<SuggestionBarProps> = {},
): SuggestionBarProps {
  return {
    status: { kind: "idle" },
    phrases: [],
    onEnable: vi.fn(),
    onPhraseSelect: vi.fn(),
    ...overrides,
  };
}

describe("SuggestionBar", () => {
  test("renders accessible phrase chips and selects their corresponding phrases", async () => {
    const props = makeProps({ phrases: ["Hello", "Goodbye"] });
    const screen = await renderWithProviders(<SuggestionBar {...props} />);

    await expectNoA11yViolations(screen.container);

    await screen.getByRole("button", { name: "Hello" }).click();

    expect(props.onPhraseSelect).toHaveBeenCalledWith("Hello");
    expect(props.onPhraseSelect).toHaveBeenCalledTimes(1);

    await screen.getByRole("button", { name: "Goodbye" }).click();

    expect(props.onPhraseSelect).toHaveBeenCalledWith("Goodbye");
    expect(props.onPhraseSelect).toHaveBeenCalledTimes(2);
  });

  test("groups the phrase chips under a name", async () => {
    const props = makeProps({ phrases: ["Hello", "Goodbye"] });
    const screen = await renderWithProviders(<SuggestionBar {...props} />);
    const suggestions = screen.getByRole("group", { name: "Suggestions" });

    await expect.element(suggestions.getByRole("button")).toHaveLength(2);
  });

  test("exposes no suggestion group while there are no phrases", async () => {
    const screen = await renderWithProviders(
      <SuggestionBar {...makeProps()} />,
    );

    await expect
      .element(screen.getByRole("group", { name: "Suggestions" }))
      .not.toBeInTheDocument();
  });

  test("offers an enable chip when suggestions are not enabled", async () => {
    const props = makeProps({ status: { kind: "not-enabled" } });
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
      .element(screen.getByText("Downloading AI model… 43% complete"))
      .toBeVisible();
  });

  test("shows a percentless download message while progress is unknown", async () => {
    const screen = await renderWithProviders(
      <SuggestionBar
        {...makeProps({ status: { kind: "downloading", percent: null } })}
      />,
    );

    await expect
      .element(screen.getByText("Downloading AI model…", { exact: true }))
      .toBeVisible();
  });

  test("shows that suggestions are unavailable on the device", async () => {
    const screen = await renderWithProviders(
      <SuggestionBar {...makeProps({ status: { kind: "unavailable" } })} />,
    );

    await expect
      .element(screen.getByText("Suggestions unavailable on this device"))
      .toBeVisible();
  });

  test("shows that suggestions failed with no accessibility violations", async () => {
    const screen = await renderWithProviders(
      <SuggestionBar {...makeProps({ status: { kind: "failed" } })} />,
    );

    await expect
      .element(screen.getByText("Couldn't get suggestions"))
      .toBeVisible();

    await expectNoA11yViolations(screen.container);
  });
});
