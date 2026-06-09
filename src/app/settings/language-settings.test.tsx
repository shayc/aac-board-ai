import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import {
  stubBuiltInAIUnsupported,
  stubTranslator,
} from "@shared/testing/built-in-ai";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { LanguageSettings } from "./language-settings";

function renderLanguageSettings() {
  return render(
    <AppProviders>
      <LanguageSettings />
    </AppProviders>,
  );
}

describe("LanguageSettings", () => {
  test("disables the language select without the Translator", async () => {
    stubBuiltInAIUnsupported("Translator");

    const screen = await renderLanguageSettings();

    await expect
      .element(screen.getByRole("combobox", { name: "Language" }))
      .toHaveAttribute("aria-disabled", "true");
  });

  test("enables the language select when the Translator is available, with no a11y violations", async () => {
    stubTranslator();

    const screen = await renderLanguageSettings();

    const select = screen.getByRole("combobox", { name: "Language" });
    await expect.element(select).not.toHaveAttribute("aria-disabled");
    await expect.element(select).toHaveTextContent("English");

    await expectNoA11yViolations(screen.container);
  });
});
