import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import {
  stubBuiltInAIUnsupported,
  stubTranslator,
} from "@shared/testing/built-in-ai";
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
  test("hides the language select without the Translator", async () => {
    stubBuiltInAIUnsupported("Translator");

    const screen = await renderLanguageSettings();

    await expect
      .element(screen.getByRole("combobox", { name: "Language" }))
      .not.toBeInTheDocument();
  });

  test("enables the language select when the Translator is available, with no a11y violations", async () => {
    // The language list derives from TTS voices, which headless CI lacks.
    stubVoices([{ voiceURI: "us-1", name: "Samantha", lang: "en-US" }]);
    stubTranslator();

    const screen = await renderLanguageSettings();

    const select = screen.getByRole("combobox", { name: "Language" });
    await expect.element(select).not.toHaveAttribute("aria-disabled");
    await expect.element(select).toHaveTextContent("English");

    await expectNoA11yViolations(screen.container);
  });
});
