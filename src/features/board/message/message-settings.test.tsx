import { AppProviders } from "@shared/providers/app-providers";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { MessageSettings } from "./message-settings";

async function renderMessageSettings() {
  return render(
    <AppProviders>
      <MessageSettings />
    </AppProviders>,
  );
}

function readStoredPreferences(): unknown {
  return JSON.parse(localStorage.getItem("message-preferences") ?? "null");
}

describe("MessageSettings", () => {
  test("toggles images in the message bar", async () => {
    const screen = await renderMessageSettings();
    const imagesSwitch = screen.getByRole("switch", { name: "Show images" });

    await expect.element(imagesSwitch).toBeChecked();
    await imagesSwitch.click();

    await expect.element(imagesSwitch).not.toBeChecked();
    await vi.waitFor(() =>
      expect(readStoredPreferences()).toMatchObject({
        areImagesVisible: false,
      }),
    );
  });

  test("toggles message highlighting during playback", async () => {
    const screen = await renderMessageSettings();
    const highlightSwitch = screen.getByRole("switch", {
      name: "Highlight while speaking",
    });

    await expect.element(highlightSwitch).toBeChecked();
    await highlightSwitch.click();

    await expect.element(highlightSwitch).not.toBeChecked();
    await vi.waitFor(() =>
      expect(readStoredPreferences()).toMatchObject({
        isHighlightingEnabled: false,
      }),
    );
  });

  test("toggles starting a new message after speaking", async () => {
    const screen = await renderMessageSettings();
    const autoClearSwitch = screen.getByRole("switch", {
      name: "Start a new message after speaking",
    });

    await expect.element(autoClearSwitch).toBeChecked();
    await autoClearSwitch.click();

    await expect.element(autoClearSwitch).not.toBeChecked();
    await vi.waitFor(() =>
      expect(readStoredPreferences()).toMatchObject({
        isAutoClearEnabled: false,
      }),
    );
  });
});
