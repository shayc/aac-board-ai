import { setStoredLanguage } from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { setSpeechVoiceURI } from "@shared/speech/speech-store";
import { stubSpeech, stubVoices } from "@shared/testing/stub-speech";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { SpeechSettings } from "./speech-settings";

function renderSpeechSettings() {
  return render(
    <AppProviders>
      <SpeechSettings />
    </AppProviders>,
  );
}

describe("SpeechSettings", () => {
  test("renders the speech sliders and preview action with no accessibility violations", async () => {
    stubVoices([{ voiceURI: "us-1", name: "Samantha", lang: "en-US" }]);

    const screen = await renderSpeechSettings();

    const expectedValues = [
      { name: "Speed", text: "1.0×" },
      { name: "Pitch", text: "100%" },
      { name: "Volume", text: "100%" },
    ];
    for (const { name, text } of expectedValues) {
      await expect
        .element(screen.getByRole("slider", { name }))
        .toHaveAttribute("aria-valuetext", text);
    }
    await expect.element(screen.getByText("1.0×")).toBeVisible();
    const percentValues = screen.getByText("100%").all();
    expect(percentValues).toHaveLength(2);
    for (const value of percentValues) {
      await expect.element(value).toBeVisible();
    }
    await expect
      .element(screen.getByRole("button", { name: "Preview voice" }))
      .toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });

  test("groups voices under locale subheaders when multiple locales exist", async () => {
    stubVoices([
      { voiceURI: "us-1", name: "Samantha", lang: "en-US" },
      { voiceURI: "us-2", name: "Alex", lang: "en-US" },
      { voiceURI: "gb-1", name: "Daniel", lang: "en-GB" },
    ]);

    const screen = await renderSpeechSettings();

    await screen.getByRole("combobox", { name: "Voice" }).click();

    await expect
      .element(screen.getByText("American English"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("British English"))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("option", { name: "Daniel" }))
      .toBeInTheDocument();
  });

  test("omits locale subheaders when all voices share one locale", async () => {
    stubVoices([
      { voiceURI: "us-1", name: "Samantha", lang: "en-US" },
      { voiceURI: "us-2", name: "Alex", lang: "en-US" },
    ]);

    const screen = await renderSpeechSettings();

    await screen.getByRole("combobox", { name: "Voice" }).click();

    await expect
      .element(screen.getByRole("option", { name: "Samantha" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("American English"))
      .not.toBeInTheDocument();
  });

  test("selects and persists a voice", async () => {
    stubVoices([
      { voiceURI: "us-1", name: "Samantha", lang: "en-US" },
      { voiceURI: "us-2", name: "Alex", lang: "en-US" },
    ]);
    const screen = await renderSpeechSettings();
    const voiceSelect = screen.getByRole("combobox", { name: "Voice" });

    await voiceSelect.click();
    await screen.getByRole("option", { name: "Alex" }).click();

    await expect.element(voiceSelect).toHaveTextContent("Alex");
    await vi.waitFor(() => {
      const stored = localStorage.getItem("speech-preferences");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? "{}")).toMatchObject({ voiceURI: "us-2" });
    });
  });

  test("shows the voice that will speak when the saved voice belongs to another language", async () => {
    stubVoices([
      { voiceURI: "us-1", name: "Samantha", lang: "en-US" },
      { voiceURI: "he-1", name: "Carmit", lang: "he-IL" },
    ]);
    setSpeechVoiceURI("us-1");
    setStoredLanguage("he");

    const screen = await renderSpeechSettings();

    await expect
      .element(screen.getByRole("combobox", { name: "קול" }))
      .toHaveTextContent("Carmit");
  });

  test("formats slider values in the UI locale when the language has only a voice", async () => {
    stubVoices([{ voiceURI: "fa-1", name: "Dilara", lang: "fa-IR" }]);
    setStoredLanguage("fa");

    const screen = await renderSpeechSettings();

    await expect
      .element(screen.getByRole("slider", { name: "Speed" }))
      .toHaveAttribute("aria-valuetext", "1.0×");
    await expect
      .element(screen.getByRole("slider", { name: "Pitch" }))
      .toHaveAttribute("aria-valuetext", "100%");
  });

  test("adjusts and persists rate, pitch, and volume", async () => {
    const screen = await renderSpeechSettings();
    const adjustments = [
      { name: "Speed", key: "{ArrowRight}", expected: 1.1 },
      { name: "Pitch", key: "{ArrowLeft}", expected: 0.9 },
      { name: "Volume", key: "{ArrowLeft}", expected: 0.9 },
    ];

    for (const { name, key, expected } of adjustments) {
      const slider = screen.getByRole("slider", { name });
      slider.element().focus();
      await userEvent.keyboard(key);
      expect(Number(slider.element().getAttribute("aria-valuenow"))).toBe(
        expected,
      );
    }

    await vi.waitFor(() => {
      const stored = localStorage.getItem("speech-preferences");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? "{}")).toMatchObject({
        rate: 1.1,
        pitch: 0.9,
        volume: 0.9,
      });
    });
  });

  test("keeps volume above silence at the lowest setting", async () => {
    const screen = await renderSpeechSettings();
    const volumeSlider = screen.getByRole("slider", { name: "Volume" });

    volumeSlider.element().focus();
    await userEvent.keyboard("{Home}");

    await expect.element(volumeSlider).toHaveAttribute("aria-valuenow", "0.1");
    await expect.element(volumeSlider).toHaveAttribute("aria-valuetext", "10%");
  });

  test("plays the voice preview through app playback", async () => {
    const speech = stubSpeech();
    stubVoices([]);
    const screen = await renderSpeechSettings();

    await screen.getByRole("button", { name: "Preview voice" }).click();

    expect(speech.spokenTexts()).toEqual(["Hi, this is my voice!"]);
  });
});
