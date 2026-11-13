import { locales } from "@paraglide/runtime";
import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { stubRewriter } from "@shared/testing/stub-built-in-ai";
import { setTestViewport } from "@shared/testing/viewport";
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
  test("renders the onboarding content with no accessibility violations", async () => {
    const screen = await renderDialog(vi.fn());

    await expect
      .element(screen.getByRole("dialog", { name: "Welcome to AAC Board AI" }))
      .toBeVisible();

    for (const text of [
      "Tap to speak",
      "Build a message with symbols and hear it spoken aloud.",
      "Free and private",
      "No account, ads or tracking. Works offline.",
    ]) {
      await expect.element(screen.getByText(text)).toBeVisible();
    }

    await expectNoA11yViolations(document.body);
  });

  test("promises the interface languages when suggestions are unsupported", async () => {
    const screen = await renderDialog(vi.fn());

    await expect
      .element(
        screen.getByText(`Use the app in any of ${locales.length} languages.`),
      )
      .toBeVisible();
    await expect
      .element(screen.getByText("Say more with fewer taps"))
      .not.toBeInTheDocument();
  });

  test("promises suggestions when a suggestion engine is supported", async () => {
    stubRewriter();
    const screen = await renderDialog(vi.fn());

    await expect
      .element(screen.getByText("Say more with fewer taps"))
      .toBeVisible();
    await expect
      .element(screen.getByText("In your language"))
      .not.toBeInTheDocument();
  });

  test("calls onClose when Continue is clicked", async () => {
    const onClose = vi.fn();
    const screen = await renderDialog(onClose);

    await screen.getByRole("button", { name: "Continue" }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });

  test.each([
    { screen: "a phone on its side", width: 667, height: 375 },
    { screen: "a small phone on its side", width: 568, height: 320 },
    { screen: "a small upright phone", width: 320, height: 568 },
  ])("keeps Continue in view on $screen", async ({ width, height }) => {
    await setTestViewport(width, height);
    const screen = await renderDialog(vi.fn());

    const continueButton = screen.getByRole("button", { name: "Continue" });
    await expect.element(continueButton).toBeVisible();

    await expect.element(continueButton).toBeInViewport({ ratio: 1 });
  });
});
