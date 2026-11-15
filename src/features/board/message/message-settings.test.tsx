import { renderWithProviders } from "@shared/testing/render-with-providers";
import { readStoredPreferences } from "@shared/testing/stored-preferences";
import { describe, expect, test, vi } from "vitest";
import { MessageSettings } from "./message-settings";

describe("MessageSettings", () => {
  test.each([
    {
      name: "Show images",
      preference: "areImagesVisible",
      effect: "images in the message bar",
    },
    {
      name: "Highlight while speaking",
      preference: "isHighlightingEnabled",
      effect: "highlighting while speaking",
    },
    {
      name: "Clear after speaking",
      preference: "clearsAfterSpeaking",
      effect: "clearing after speaking",
    },
  ])(
    "turns off $effect and persists the choice",
    async ({ name, preference }) => {
      const screen = await renderWithProviders(<MessageSettings />);
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
