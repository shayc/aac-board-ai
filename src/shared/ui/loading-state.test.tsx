import { AppProviders } from "@shared/providers/app-providers";
import { expectNoA11yViolations } from "@shared/testing/axe";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { LoadingState } from "./loading-state";

describe("LoadingState", () => {
  test("names the progress indicator with the default loading message", async () => {
    const screen = await render(
      <AppProviders>
        <LoadingState />
      </AppProviders>,
    );

    await expect
      .element(screen.getByRole("progressbar", { name: "Loading..." }))
      .toBeInTheDocument();

    // Wait for the fade so axe checks the final text contrast.
    await vi.waitFor(() => {
      const content = screen.getByText("Loading...").element().parentElement;
      expect(content && getComputedStyle(content).opacity).toBe("1");
    });

    await expectNoA11yViolations(screen.container);
  });

  test("names the progress indicator with a custom loading message", async () => {
    const screen = await render(
      <AppProviders>
        <LoadingState message="Loading board sets..." />
      </AppProviders>,
    );

    await expect
      .element(
        screen.getByRole("progressbar", { name: "Loading board sets..." }),
      )
      .toBeInTheDocument();
  });

  test("keeps an accessible name when the visible message is hidden", async () => {
    const screen = await render(
      <AppProviders>
        <LoadingState message="" />
      </AppProviders>,
    );

    await expect
      .element(screen.getByRole("progressbar", { name: "Loading..." }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText("Loading..."))
      .not.toBeInTheDocument();
  });
});
