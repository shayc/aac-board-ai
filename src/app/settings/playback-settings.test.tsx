import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { PlaybackSettings } from "./playback-settings";

describe("PlaybackSettings", () => {
  test("toggles the highlight-while-playing switch with no a11y violations", async () => {
    const screen = await render(
      <AppProviders>
        <PlaybackSettings />
      </AppProviders>,
    );

    const highlightSwitch = screen.getByRole("switch", {
      name: "Highlight while playing",
    });

    await expect.element(highlightSwitch).not.toBeChecked();
    await highlightSwitch.click();
    await expect.element(highlightSwitch).toBeChecked();

    await expectNoA11yViolations(screen.container);
  });
});
