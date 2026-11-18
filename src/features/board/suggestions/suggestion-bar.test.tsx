import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { SuggestionBar, type SuggestionBarProps } from "./suggestion-bar";

function makeProps(
  overrides: Partial<SuggestionBarProps> = {},
): SuggestionBarProps {
  return {
    status: { kind: "idle" },
    phrases: [],
    language: "en",
    onEnable: vi.fn(),
    onPhraseSelect: vi.fn(),
    ...overrides,
  };
}

describe("SuggestionBar", () => {
  test("has no accessibility violations with phrase chips", async () => {
    const props = makeProps({ phrases: ["Hello", "Goodbye"] });
    const screen = await renderWithProviders(<SuggestionBar {...props} />);
    await expect
      .element(screen.getByRole("button", { name: "Hello" }))
      .toBeVisible();

    await expectNoA11yViolations(screen.container);
  });

  test("has no accessibility violations while more phrases are pending", async () => {
    const props = makeProps({
      status: { kind: "pending" },
      phrases: ["Hello"],
    });
    const screen = await renderWithProviders(<SuggestionBar {...props} />);
    await expect
      .element(screen.getByTestId("suggestions-pending"))
      .toBeVisible();

    await expectNoA11yViolations(screen.container);
  });

  test("shows the pending dots only while a source is still answering", async () => {
    const props = makeProps({ status: { kind: "pending" } });
    const screen = await renderWithProviders(<SuggestionBar {...props} />);
    await expect
      .element(screen.getByTestId("suggestions-pending"))
      .toBeVisible();

    await screen.rerender(
      <SuggestionBar
        {...props}
        status={{ kind: "idle" }}
        phrases={["Hello"]}
      />,
    );

    await expect
      .element(screen.getByTestId("suggestions-pending"))
      .not.toBeInTheDocument();
  });

  test("fades the pending dots in again once the first phrase arrives", async () => {
    const props = makeProps({ status: { kind: "pending" } });
    const screen = await renderWithProviders(<SuggestionBar {...props} />);
    await expect
      .element(screen.getByTestId("suggestions-pending"), { timeout: 3000 })
      .toHaveStyle({ opacity: "1" });

    await screen.rerender(<SuggestionBar {...props} phrases={["Hello"]} />);

    await expect
      .element(screen.getByTestId("suggestions-pending"))
      .toHaveStyle({ opacity: "0" });
  });

  test("has no accessibility violations when suggestions failed", async () => {
    const screen = await renderWithProviders(
      <SuggestionBar {...makeProps({ status: { kind: "failed" } })} />,
    );
    await expect
      .element(screen.getByText("Couldn't get suggestions"))
      .toBeVisible();

    await expectNoA11yViolations(screen.container);
  });

  test("selects the phrase of the chip that is clicked", async () => {
    const props = makeProps({ phrases: ["Hello", "Goodbye"] });
    const screen = await renderWithProviders(<SuggestionBar {...props} />);

    await screen.getByRole("button", { name: "Hello" }).click();

    expect(props.onPhraseSelect).toHaveBeenCalledWith("Hello");
    expect(props.onPhraseSelect).toHaveBeenCalledTimes(1);

    await screen.getByRole("button", { name: "Goodbye" }).click();

    expect(props.onPhraseSelect).toHaveBeenCalledWith("Goodbye");
    expect(props.onPhraseSelect).toHaveBeenCalledTimes(2);
  });

  test("marks each phrase with the language it is written in", async () => {
    const props = makeProps({ phrases: ["Hola"], language: "es" });
    const screen = await renderWithProviders(<SuggestionBar {...props} />);

    await expect
      .element(screen.getByRole("button", { name: "Hola" }))
      .toHaveAttribute("lang", "es");
  });

  test("groups the phrase chips under a name", async () => {
    const props = makeProps({ phrases: ["Hello", "Goodbye"] });
    const screen = await renderWithProviders(<SuggestionBar {...props} />);
    const suggestions = screen.getByRole("group", { name: "Suggestions" });

    await expect.element(suggestions.getByRole("button")).toHaveLength(2);
  });

  // Tab can stop with a chip flush against the edge or with only a sliver visible.
  test.each([266, 288])(
    "keeps each tabbed chip's full focus ring visible in a %ipx row",
    async (width) => {
      const props = makeProps({
        phrases: ["I want more.", "I'd like more.", "More, please."],
      });
      const screen = await renderWithProviders(
        <div style={{ width }}>
          <SuggestionBar {...props} />
        </div>,
      );
      const group = screen
        .getByRole("group", { name: "Suggestions" })
        .element();
      expect(group.scrollWidth).toBeGreaterThan(group.clientWidth);

      for (const phrase of props.phrases) {
        const button = screen.getByRole("button", { name: phrase });
        await userEvent.tab();

        await expect.element(button).toHaveFocus();
        const chip = button.element().getBoundingClientRect();
        const viewport = group.getBoundingClientRect();
        // The theme's 2px outline sits 2px outside the chip.
        expect(chip.left - viewport.left).toBeGreaterThanOrEqual(4);
        expect(viewport.right - chip.right).toBeGreaterThanOrEqual(4);
        expect(chip.top - viewport.top).toBeGreaterThanOrEqual(4);
        expect(viewport.bottom - chip.bottom).toBeGreaterThanOrEqual(4);
      }
    },
  );

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

  test("shows that suggestions failed", async () => {
    const screen = await renderWithProviders(
      <SuggestionBar {...makeProps({ status: { kind: "failed" } })} />,
    );

    await expect
      .element(screen.getByText("Couldn't get suggestions"))
      .toBeVisible();
  });
});
