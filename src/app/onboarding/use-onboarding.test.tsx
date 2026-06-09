import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { useOnboarding } from "./use-onboarding";

function OnboardingProbe() {
  const { shouldShow, dismiss } = useOnboarding();

  return shouldShow ? (
    <button onClick={dismiss}>dismiss</button>
  ) : (
    <p>onboarding hidden</p>
  );
}

describe("useOnboarding", () => {
  test("shows until dismissed, then stays hidden and persists", async () => {
    const first = await render(<OnboardingProbe />);

    await first.getByRole("button", { name: "dismiss" }).click();
    await expect
      .element(first.getByText("onboarding hidden"))
      .toBeInTheDocument();
    await first.unmount();

    const second = await render(<OnboardingProbe />);
    await expect
      .element(second.getByText("onboarding hidden"))
      .toBeInTheDocument();

    // Persistence is debounced, so poll for the write.
    await vi.waitFor(() => {
      expect(localStorage.getItem("hasSeenOnboarding")).toBe("true");
    });
  });
});
