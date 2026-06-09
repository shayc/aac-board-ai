import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { stubVoices } from "@shared/testing/device-output";
import { describe, expect, test } from "vitest";
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
    expect(screen.container.ownerDocument.body.textContent).not.toContain(
      "American English",
    );
  });

  test("renders the speech sliders and preview action", async () => {
    stubVoices([{ voiceURI: "us-1", name: "Samantha", lang: "en-US" }]);

    const screen = await renderSpeechSettings();

    await expect
      .element(screen.getByRole("slider", { name: "Rate" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("slider", { name: "Pitch" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("slider", { name: "Volume" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("button", { name: "Preview" }))
      .toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });
});
