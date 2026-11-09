import { translateBoardSet } from "@features/board";
import {
  makeOBFBoard,
  resetBoardsDB,
  seedBoardSets,
} from "@features/board/testing";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { stubTranslator } from "@shared/testing/stub-built-in-ai";
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
    const screen = await renderLanguageSettings();
    const select = screen.getByRole("combobox", { name: "Language" });

    await expect.element(select).not.toHaveAttribute("aria-disabled");
    await expect
      .element(screen.getByText(/Automatic board translation is unavailable/))
      .toBeInTheDocument();
  });

  test("hides the board translation notice when the Translator is available with no accessibility violations", async () => {
    stubVoices([{ voiceURI: "us-1", name: "Samantha", lang: "en-US" }]);
    stubTranslator();

    const screen = await renderLanguageSettings();

    await expect
      .element(screen.getByRole("combobox", { name: "Language" }))
      .toHaveTextContent("English");
    await expect
      .element(screen.getByText(/Automatic board translation is unavailable/))
      .not.toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });

  test("shows board translation progress until the board set is translated", async () => {
    await resetBoardsDB();
    await seedBoardSets([
      {
        id: "animals",
        rootBoardId: "home",
        boards: [
          makeOBFBoard({ id: "home", name: "Home" }),
          makeOBFBoard({ id: "pets", name: "Pets" }),
        ],
      },
    ]);
    const translationGate = Promise.withResolvers<void>();
    stubTranslator(async (input) => {
      await translationGate.promise;

      return input;
    });

    const screen = await renderLanguageSettings();
    const translation = translateBoardSet("animals", "es", {
      signal: new AbortController().signal,
      onBoardTranslated: () => undefined,
    });

    await expect
      .element(screen.getByText("Translating boards..."))
      .toBeVisible();
    await expect.element(screen.getByText("0% complete")).toBeVisible();

    translationGate.resolve();
    await translation;

    await expect
      .element(screen.getByText("Translating boards..."))
      .not.toBeInTheDocument();
  });
});
