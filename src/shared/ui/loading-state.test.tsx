import { expectNoA11yViolations } from "@shared/testing/axe";
import { renderWithProviders } from "@shared/testing/render-with-providers";
import { describe, expect, test, vi } from "vitest";
import { LoadingState } from "./loading-state";

describe("LoadingState", () => {
  test("names the progress indicator with the default loading message", async () => {
    const screen = await renderWithProviders(<LoadingState />);

    await expect
      .element(screen.getByRole("progressbar", { name: "Loading…" }))
      .toBeInTheDocument();
  });

  test("has no accessibility violations once it has faded in", async () => {
    const screen = await renderWithProviders(<LoadingState />);

    // Wait for the fade so axe checks the final text contrast.
    await vi.waitFor(() => {
      const content = screen.getByText("Loading…").element().parentElement;
      expect(content && getComputedStyle(content).opacity).toBe("1");
    });

    await expectNoA11yViolations(screen.container);
  });

  test("exposes the message to assistive technology once, as the indicator's name", async () => {
    const screen = await renderWithProviders(<LoadingState />);

    await expect
      .element(screen.getByRole("progressbar", { name: "Loading…" }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Loading…"))
      .toHaveAttribute("aria-hidden", "true");
  });

  test("names the progress indicator with a custom loading message", async () => {
    const screen = await renderWithProviders(
      <LoadingState message="Loading board sets…" />,
    );

    await expect
      .element(screen.getByRole("progressbar", { name: "Loading board sets…" }))
      .toBeInTheDocument();
  });
});
