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
  test("marks every capability unavailable without Built-in AI", async () => {
    stubBuiltInAIUnsupported("Proofreader", "Rewriter", "Translator");

    const screen = await renderAISettings();

    await expect.element(screen.getByText("Proofreading")).toBeInTheDocument();
    expect(screen.getByTestId("CancelIcon").elements()).toHaveLength(3);
    expect(screen.getByTestId("CheckCircleIcon").elements()).toHaveLength(0);
    expect(screen.container.ownerDocument.body.textContent).not.toContain(
      "Custom instructions",
    );
  });

  test("marks capabilities available and offers custom instructions when supported", async () => {
    stubProofreader();
    stubRewriter();
    stubTranslator();

    const screen = await renderAISettings();

    expect(screen.getByTestId("CheckCircleIcon").elements()).toHaveLength(3);
    expect(screen.getByTestId("CancelIcon").elements()).toHaveLength(0);
    await expect
      .element(screen.getByRole("textbox", { name: "Custom instructions" }))
      .toBeInTheDocument();

    await expectNoA11yViolations(screen.container);
  });
});
