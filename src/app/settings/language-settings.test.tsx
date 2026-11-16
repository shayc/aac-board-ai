import {
  expectNoA11yViolations,
  MUI_OUTLINED_INPUT_CONTRAST_REVIEW,
} from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { stubVoices } from "@shared/testing/stub-speech";
import { describe, expect, test } from "vitest";
import { LanguageSettings } from "./language-settings";

describe("LanguageSettings", () => {
  test("has no accessibility violations", async () => {
    stubVoices([{ voiceURI: "us-1", name: "Samantha", lang: "en-US" }]);

    const screen = await renderWithProviders(<LanguageSettings />);
    await expect
      .element(screen.getByRole("combobox", { name: "Language" }))
      .toHaveTextContent("English");

    await expectNoA11yViolations(screen.container, {
      reviewedIncomplete: [MUI_OUTLINED_INPUT_CONTRAST_REVIEW],
    });
  });

  test("keeps language selection available and shows no notice without the Translator", async () => {
    const screen = await renderWithProviders(<LanguageSettings />);
    const select = screen.getByRole("combobox", { name: "Language" });

    await expect.element(select).not.toHaveAttribute("aria-disabled");
    await expect.element(screen.getByRole("status")).not.toBeInTheDocument();
  });

  test("shows the communication language as the selection", async () => {
    stubVoices([{ voiceURI: "us-1", name: "Samantha", lang: "en-US" }]);

    const screen = await renderWithProviders(<LanguageSettings />);

    await expect
      .element(screen.getByRole("combobox", { name: "Language" }))
      .toHaveTextContent("English");
  });
});
