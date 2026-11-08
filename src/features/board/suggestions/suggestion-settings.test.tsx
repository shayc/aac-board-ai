import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import {
  stubProofreader,
  stubRewriter,
  stubTranslator,
} from "@shared/testing/stub-built-in-ai";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { SuggestionSettings } from "./suggestion-settings";

function renderSuggestionSettings() {
  return render(
    <AppProviders>
      <SuggestionSettings />
    </AppProviders>,
  );
}

describe("SuggestionSettings", () => {
  test("shows an unsupported message instead of controls when the rewriter is unsupported", async () => {
    stubProofreader();

    const screen = await renderSuggestionSettings();

    await expect
      .element(
        screen.getByText("Suggestions are unavailable in this browser.", {
          exact: false,
        }),
      )
      .toBeVisible();

    const helpLink = screen.getByRole("link", {
      name: "How to enable suggestions (opens in new tab)",
    });

    await expect.element(helpLink).toBeVisible();
    await expect
      .element(helpLink)
      .toHaveAttribute(
        "href",
        "https://github.com/shayc/aac-board-ai#enable-suggestions",
      );
    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .not.toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });

  test("shows custom instructions when the rewriter is supported with no accessibility violations", async () => {
    stubProofreader();
    stubRewriter();
    stubTranslator();

    const screen = await renderSuggestionSettings();

    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });

  test("edits and persists custom instructions", async () => {
    stubRewriter();
    const screen = await renderSuggestionSettings();
    const instructions = screen.getByRole("textbox", {
      name: "Custom instructions",
    });

    await instructions.fill("Prefer short, everyday words");

    await expect
      .element(instructions)
      .toHaveValue("Prefer short, everyday words");
    await vi.waitFor(() =>
      expect(localStorage.getItem("suggestion-preferences")).toBe(
        JSON.stringify({ customInstructions: "Prefer short, everyday words" }),
      ),
    );
  });
});
