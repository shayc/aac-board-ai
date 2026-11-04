import { AppProviders } from "@shared/providers/app-providers";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { PlaybackSettings } from "./playback-settings";

describe("PlaybackSettings", () => {
  test("toggles message highlighting during playback", async () => {
    const screen = await render(
      <AppProviders>
        <PlaybackSettings />
      </AppProviders>,
    );
    const highlightSwitch = screen.getByRole("switch", {
      name: "Highlight while speaking",
    });

    await expect.element(highlightSwitch).not.toBeChecked();
    await highlightSwitch.click();

    await expect.element(highlightSwitch).toBeChecked();
    await vi.waitFor(() =>
      expect(localStorage.getItem("playback-preferences")).toBe(
        JSON.stringify({ isHighlightingEnabled: true }),
      ),
    );
  });
});
