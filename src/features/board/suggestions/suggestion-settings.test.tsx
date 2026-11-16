import readme from "/README.md?raw";
import {
  DEFAULT_LANGUAGE,
  setCommunicationLanguage,
} from "@shared/language/language-store";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import {
  stubProofreader,
  stubRewriter,
  stubTranslator,
} from "@shared/testing/stub-built-in-ai";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { SuggestionSettings } from "./suggestion-settings";

function availableWithoutLanguages(options?: Record<string, unknown>) {
  return Promise.resolve<Availability>(
    options?.expectedInputLanguages === undefined ? "available" : "unavailable",
  );
}

describe("SuggestionSettings", () => {
  beforeEach(() => {
    setCommunicationLanguage(DEFAULT_LANGUAGE);
  });

  test("has no accessibility violations when suggestions are unsupported", async () => {
    const screen = await renderWithProviders(<SuggestionSettings />);
    await expect
      .element(
        screen.getByRole("link", {
          name: "How to enable suggestions (opens in new tab)",
        }),
      )
      .toBeVisible();

    await expectNoA11yViolations(screen.container);
  });

  test("has no accessibility violations with custom instructions", async () => {
    stubProofreader();
    stubRewriter();
    stubTranslator();

    const screen = await renderWithProviders(<SuggestionSettings />);
    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });

  test("has no accessibility violations when no engine supports the language", async () => {
    setCommunicationLanguage("he");
    stubProofreader().availability.mockImplementation(
      availableWithoutLanguages,
    );
    stubRewriter().availability.mockImplementation(availableWithoutLanguages);

    const screen = await renderWithProviders(<SuggestionSettings />);
    await expect
      .element(screen.getByText("ההצעות אינן זמינות בשפה הזו."))
      .toBeVisible();

    await expectNoA11yViolations(screen.container);
  });

  test("shows an unsupported message instead of controls when no suggestion engine is supported", async () => {
    const screen = await renderWithProviders(<SuggestionSettings />);

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
        "https://github.com/shayc/aac-board-ai#enable-ai-suggestions",
      );
    expect(readme).toMatch(/^## Enable AI suggestions$/m);

    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .not.toBeInTheDocument();
  });

  test("says only custom instructions are unavailable when the proofreader still suggests", async () => {
    stubProofreader();

    const screen = await renderWithProviders(<SuggestionSettings />);

    await expect
      .element(
        screen.getByText(
          "Custom instructions are unavailable in this browser.",
          { exact: false },
        ),
      )
      .toBeVisible();
    await expect
      .element(screen.getByText(/Suggestions are unavailable/))
      .not.toBeInTheDocument();
    await expect
      .element(
        screen.getByRole("link", {
          name: "How to enable suggestions (opens in new tab)",
        }),
      )
      .toBeVisible();
  });

  test("shows custom instructions when the rewriter is supported", async () => {
    stubProofreader();
    stubRewriter();
    stubTranslator();

    const screen = await renderWithProviders(<SuggestionSettings />);

    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .toBeInTheDocument();
  });

  test("says the language is unsupported instead of showing custom instructions when no engine supports it", async () => {
    setCommunicationLanguage("he");
    stubProofreader().availability.mockImplementation(
      availableWithoutLanguages,
    );
    stubRewriter().availability.mockImplementation(availableWithoutLanguages);

    const screen = await renderWithProviders(<SuggestionSettings />);

    await expect
      .element(screen.getByText("ההצעות אינן זמינות בשפה הזו."))
      .toBeVisible();
    await expect.element(screen.getByRole("textbox")).not.toBeInTheDocument();
    await expect.element(screen.getByRole("link")).not.toBeInTheDocument();
  });

  test("points to the setup help when the device cannot run any engine", async () => {
    stubProofreader().availability.mockResolvedValue("unavailable");
    stubRewriter().availability.mockResolvedValue("unavailable");

    const screen = await renderWithProviders(<SuggestionSettings />);

    await expect
      .element(
        screen.getByText("Suggestions are unavailable in this browser.", {
          exact: false,
        }),
      )
      .toBeVisible();
    await expect
      .element(
        screen.getByRole("link", {
          name: "How to enable suggestions (opens in new tab)",
        }),
      )
      .toBeVisible();
  });

  test("keeps custom instructions when the language check fails", async () => {
    stubRewriter().availability.mockRejectedValue(new Error("Probe failed"));

    const screen = await renderWithProviders(<SuggestionSettings />);

    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .toBeVisible();
  });

  test("edits and persists custom instructions", async () => {
    stubRewriter();
    const screen = await renderWithProviders(<SuggestionSettings />);
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
