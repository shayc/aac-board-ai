import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
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
  test("renders the welcome content when open", async () => {
    const screen = await renderDialog(vi.fn());

    await expect
      .element(screen.getByRole("dialog", { name: "AAC Board AI" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Communicate more easily and naturally."))
      .toBeInTheDocument();
  });

  test("continue dismisses the dialog", async () => {
    const onClose = vi.fn();
    const screen = await renderDialog(onClose);

    await screen.getByRole("button", { name: "Continue" }).click();

    expect(onClose).toHaveBeenCalledOnce();
  });

  test("has no a11y violations", async () => {
    const screen = await renderDialog(vi.fn());

    await expect
      .element(screen.getByRole("dialog", { name: "AAC Board AI" }))
      .toBeVisible();

    await expectNoA11yViolations(document.body);
  });
});
