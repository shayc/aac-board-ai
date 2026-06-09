import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import {
  stubBuiltInAIUnsupported,
  stubProofreader,
  stubRewriter,
  stubTranslator,
} from "@shared/testing/built-in-ai";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { AISettings } from "./ai-settings";

function renderAISettings() {
  return render(
    <AppProviders>
      <AISettings />
    </AppProviders>,
  );
}

function countIcons(
  screen: Awaited<ReturnType<typeof renderAISettings>>,
  name: string,
) {
  return screen.getByRole("img", { name, exact: true }).elements().length;
}

describe("AISettings", () => {
  test("announces every capability as unavailable without Built-in AI", async () => {
    stubBuiltInAIUnsupported("Proofreader", "Rewriter", "Translator");

    const screen = await renderAISettings();

    await expect.element(screen.getByText("Proofreading")).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(countIcons(screen, "Unavailable")).toBe(3);
      expect(countIcons(screen, "Available")).toBe(0);
    });
    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .not.toBeInTheDocument();
  });

  test("announces capabilities as available and offers custom instructions when supported, with no a11y violations", async () => {
    stubProofreader();
    stubRewriter();
    stubTranslator();

    const screen = await renderAISettings();

    await vi.waitFor(() => {
      expect(countIcons(screen, "Available")).toBe(3);
      expect(countIcons(screen, "Unavailable")).toBe(0);
    });
    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });

  test("offers a download action when the model awaits a user gesture, and recovers on click", async () => {
    const proofreader = stubProofreader();
    proofreader.availability.mockResolvedValue("downloadable");
    stubRewriter();
    stubTranslator();

    const screen = await renderAISettings();

    const download = screen.getByRole("button", { name: "Download" });
    await expect.element(download).toBeVisible();

    await download.click();

    await vi.waitFor(() => {
      expect(proofreader.create).toHaveBeenCalled();
      expect(countIcons(screen, "Available")).toBe(3);
    });
    await expect.element(download).not.toBeInTheDocument();
  });
});
