import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import {
  stubBuiltInAIUnsupported,
  stubProofreader,
  stubRewriter,
  stubTranslator,
} from "@shared/testing/built-in-ai";
import { describe, expect, test } from "vitest";
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
  test("renders nothing when the rewriter is unsupported", async () => {
    stubBuiltInAIUnsupported("Proofreader", "Rewriter", "Translator");

    const screen = await renderSuggestionsSettings();

    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .not.toBeInTheDocument();
  });

  test("shows the tone selector and custom instructions when the rewriter is ready, with no a11y violations", async () => {
    stubProofreader();
    stubRewriter();
    stubTranslator();

    const screen = await renderSuggestionsSettings();

    await expect
      .element(screen.getByRole("radio", { name: "direct" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });

  test("hides the tone selector when the rewriter is unsupported", async () => {
    stubProofreader();
    stubBuiltInAIUnsupported("Rewriter");
    stubTranslator();

    const screen = await renderSuggestionsSettings();

    await expect
      .element(screen.getByRole("radio", { name: "direct" }))
      .not.toBeInTheDocument();
  });

  test("shows but disables the tone selector while the rewriter is downloading", async () => {
    stubProofreader();
    const rewriter = stubRewriter();
    rewriter.availability.mockResolvedValue("downloadable");
    stubTranslator();

    const screen = await renderSuggestionsSettings();

    const professional = screen.getByRole("radio", {
      name: "professional",
    });
    await expect.element(professional).toBeVisible();
    await expect.element(professional).toBeDisabled();
  });
});
