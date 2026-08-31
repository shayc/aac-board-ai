import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import {
  stubBuiltInAIUnsupported,
  stubTranslator,
} from "@shared/testing/stub-built-in-ai";
import { stubVoices } from "@shared/testing/stub-speech";
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
  test("keeps language selection available without the Translator", async () => {
    stubBuiltInAIUnsupported("Translator");

    const screen = await renderLanguageSettings();

    await expect
      .element(screen.getByRole("combobox", { name: "Language" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText(/Automatic board translation is unavailable/))
      .toBeInTheDocument();
  });

  test("enables the language select when the Translator is available, with no a11y violations", async () => {
    stubVoices([{ voiceURI: "us-1", name: "Samantha", lang: "en-US" }]);
    stubTranslator();

    const screen = await renderLanguageSettings();

    const select = screen.getByRole("combobox", { name: "Language" });
    await expect.element(select).not.toHaveAttribute("aria-disabled");
    await expect.element(select).toHaveTextContent("English");
    await expect
      .element(screen.getByText(/Automatic board translation is unavailable/))
      .not.toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });
});
