import { locales } from "@paraglide/runtime";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import {
  stubBuiltInAIUnsupported,
  stubRewriter,
} from "@shared/testing/stub-built-in-ai";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { OnboardingDialog } from "./onboarding-dialog";

function renderDialog(onClose: () => void) {
  return render(
    <AppProviders>
      <OnboardingDialog open onClose={onClose} />
    </AppProviders>,
  );
}

describe("OnboardingDialog", () => {
  test("renders the onboarding content with no a11y violations", async () => {
    stubBuiltInAIUnsupported("Rewriter");
    const screen = await renderDialog(vi.fn());

    await expect
      .element(screen.getByRole("dialog", { name: "Welcome to AAC Board AI" }))
      .toBeVisible();

    for (const text of [
      "Tap to Speak",
      "Build a message with symbols and hear it spoken aloud.",
      "Free and Private",
      "No account, ads or tracking. Works offline.",
    ]) {
      await expect.element(screen.getByText(text)).toBeVisible();
    }

    await expectNoA11yViolations(document.body);
  });

  test("promises the interface languages when suggestions are unsupported", async () => {
    stubBuiltInAIUnsupported("Rewriter");
    const screen = await renderDialog(vi.fn());

    await expect
      .element(
        screen.getByText(`Use the app in any of ${locales.length} languages.`),
      )
      .toBeVisible();
    await expect
      .element(screen.getByText("Say More with Fewer Taps"))
      .not.toBeInTheDocument();
  });

  test("promises suggestions when the Rewriter is supported", async () => {
    stubRewriter();
    const screen = await renderDialog(vi.fn());

    await expect
      .element(screen.getByText("Say More with Fewer Taps"))
      .toBeVisible();
    await expect
      .element(screen.getByText("In Your Language"))
      .not.toBeInTheDocument();
  });

  test("continue invokes onClose", async () => {
    const onClose = vi.fn();
    const screen = await renderDialog(onClose);

    await screen.getByRole("button", { name: "Continue" }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });
});
