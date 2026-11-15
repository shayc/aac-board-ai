import { renderWithProviders } from "@shared/testing/render-with-providers";
import { readStoredPreferences } from "@shared/testing/stored-preferences";
import { describe, expect, test, vi } from "vitest";
import { MessageSettings } from "./message-settings";

async function renderMessageSettings() {
  return renderWithProviders(<MessageSettings />);
}

describe("MessageSettings", () => {
  test.each([
    { name: "Show images", preference: "areImagesVisible" },
    { name: "Highlight while speaking", preference: "isHighlightingEnabled" },
    { name: "Clear after speaking", preference: "clearsAfterSpeaking" },
  ])(
    "turns off $name and persists the choice",
    async ({ name, preference }) => {
      const screen = await renderMessageSettings();
      const toggle = screen.getByRole("switch", { name });

      await expect.element(toggle).toBeChecked();
      await toggle.click();

      await expect.element(toggle).not.toBeChecked();
      await vi.waitFor(() =>
        expect(readStoredPreferences("message-preferences")).toMatchObject({
          [preference]: false,
        }),
      );
    },
  );
});
