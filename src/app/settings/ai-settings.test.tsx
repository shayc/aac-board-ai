import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import {
  stubBuiltInAIUnsupported,
  stubProofreader,
  stubRewriter,
  stubTranslator,
} from "@shared/testing/built-in-ai";
import { describe, expect, test } from "vitest";
import { render } from "vitest-browser-react";
import { AISettings } from "./ai-settings";

function renderAISettings() {
  return render(
    <AppProviders>
      <AISettings />
    </AppProviders>,
  );
}

describe("AISettings", () => {
  test("announces every capability as unavailable without Built-in AI", async () => {
    stubBuiltInAIUnsupported("Proofreader", "Rewriter", "Translator");

    const screen = await renderAISettings();

    await expect.element(screen.getByText("Proofreading")).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Unavailable", exact: true }).elements(),
    ).toHaveLength(3);
    expect(
      screen.getByRole("img", { name: "Available", exact: true }).elements(),
    ).toHaveLength(0);
    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .not.toBeInTheDocument();
  });

  test("announces capabilities as available and offers custom instructions when supported, with no a11y violations", async () => {
    stubProofreader();
    stubRewriter();
    stubTranslator();

    const screen = await renderAISettings();

    expect(
      screen.getByRole("img", { name: "Available", exact: true }).elements(),
    ).toHaveLength(3);
    expect(
      screen.getByRole("img", { name: "Unavailable", exact: true }).elements(),
    ).toHaveLength(0);
    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });
});
