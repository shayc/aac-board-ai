import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import {
  stubBuiltInAIUnsupported,
  stubProofreader,
  stubRewriter,
  stubTranslator,
} from "@shared/testing/stub-built-in-ai";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SuggestionsSettings } from "./suggestions-settings";

function renderSuggestionsSettings() {
  return render(
    <AppProviders>
      <SuggestionsSettings />
    </AppProviders>,
  );
}

describe("SuggestionsSettings", () => {
  test("shows an unsupported message instead of controls when the rewriter is unsupported", async () => {
    stubBuiltInAIUnsupported("Proofreader", "Rewriter", "Translator");

    const screen = await renderSuggestionsSettings();

    await expect
      .element(screen.getByText(/Suggestions require desktop Chrome or Edge/i))
      .toBeVisible();
    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .not.toBeInTheDocument();
  });

  test("shows custom instructions when the rewriter is supported, with no a11y violations", async () => {
    stubProofreader();
    stubRewriter();
    stubTranslator();

    const screen = await renderSuggestionsSettings();

    await expect
      .element(screen.getByRole("radio", { name: "direct" }))
      .not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });

  test("edits and persists custom instructions", async () => {
    stubRewriter();
    const screen = await renderSuggestionsSettings();
    const instructions = screen.getByRole("textbox", {
      name: "Custom instructions",
    });

    await instructions.fill("Prefer short, everyday words");

    await expect
      .element(instructions)
      .toHaveValue("Prefer short, everyday words");
    await vi.waitFor(() =>
      expect(localStorage.getItem("board-suggestions")).toBe(
        JSON.stringify({ customInstructions: "Prefer short, everyday words" }),
      ),
    );
  });
});
