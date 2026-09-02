import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
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

  test("renders the speech sliders and preview action with no a11y violations", async () => {
    stubVoices([{ voiceURI: "us-1", name: "Samantha", lang: "en-US" }]);

    const screen = await renderSpeechSettings();

    await expect
      .element(screen.getByRole("slider", { name: "Rate" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("slider", { name: "Pitch" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("slider", { name: "Speech volume" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("group", { name: "Rate" }).getByText("1x"))
      .toBeVisible();
    await expect
      .element(screen.getByRole("group", { name: "Pitch" }).getByText("1x"))
      .toBeVisible();
    await expect
      .element(
        screen.getByRole("group", { name: "Speech volume" }).getByText("100%"),
      )
      .toBeVisible();
    await expect
      .element(screen.getByRole("switch", { name: "Highlight spoken words" }))
      .not.toBeChecked();
    await expect
      .element(screen.getByRole("button", { name: "Preview" }))
      .toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });

  test("toggles spoken-word highlighting", async () => {
    const screen = await renderSpeechSettings();
    const highlightSwitch = screen.getByRole("switch", {
      name: "Highlight spoken words",
    });

    await highlightSwitch.click();

    await expect.element(highlightSwitch).toBeChecked();
    await vi.waitFor(() =>
      expect(localStorage.getItem("board-playback")).toBe(
        JSON.stringify({ isMessagePartHighlightingEnabled: true }),
      ),
    );
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
      const stored = localStorage.getItem("speech-config");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? "{}")).toMatchObject({ voiceURI: "us-2" });
    });
  });

  test("adjusts and persists rate, pitch, and volume", async () => {
    const screen = await renderSpeechSettings();
    const adjustments = [
      { name: "Rate", key: "{ArrowRight}", expected: 1.1 },
      { name: "Pitch", key: "{ArrowLeft}", expected: 0.9 },
      { name: "Speech volume", key: "{ArrowLeft}", expected: 0.9 },
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
      const stored = localStorage.getItem("speech-config");
      expect(stored).not.toBeNull();
      expect(JSON.parse(stored ?? "{}")).toMatchObject({
        rate: 1.1,
        pitch: 0.9,
        volume: 0.9,
      });
    });
  });

  test("plays the voice preview through app playback", async () => {
    const speech = stubSpeech();
    stubVoices([]);
    const screen = await renderSpeechSettings();

    await screen.getByRole("button", { name: "Preview" }).click();

    expect(speech.speak).toHaveBeenCalledTimes(1);
    expect(speech.speak.mock.calls[0][0].text).toBe("Hi, this is my voice!");
  });
});
