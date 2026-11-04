import { AppProviders } from "@shared/providers/app-providers";
import { assertDefined } from "@shared/testing/assert-defined";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { NavigationButtons } from "./navigation-buttons";

interface RenderOptions {
  canGoBack?: boolean;
  canGoHome?: boolean;
  direction?: "ltr" | "rtl";
  onBack?: () => void;
  onHome?: () => void;
}

async function renderButtons(options: RenderOptions = {}) {
  const onBack = options.onBack ?? vi.fn();
  const onHome = options.onHome ?? vi.fn();

  const screen = await render(
    <AppProviders>
      <div dir={options.direction ?? "ltr"}>
        <NavigationButtons
          canGoBack={options.canGoBack ?? false}
          canGoHome={options.canGoHome ?? false}
          onBack={onBack}
          onHome={onHome}
        />
      </div>
    </AppProviders>,
  );

  return { onBack, onHome, screen };
}

describe("NavigationButtons", () => {
  test("calls onBack when the enabled back button is clicked", async () => {
    const onBack = vi.fn();
    const { screen } = await renderButtons({ canGoBack: true, onBack });

    await screen.getByRole("button", { name: "Go back" }).click();

    expect(onBack).toHaveBeenCalledOnce();
  });

  test("calls onHome when the enabled home button is clicked", async () => {
    const onHome = vi.fn();
    const { screen } = await renderButtons({ canGoHome: true, onHome });

    await screen.getByRole("button", { name: "Go home" }).click();

    expect(onHome).toHaveBeenCalledOnce();
  });

  test("disables unavailable navigation actions", async () => {
    const { screen } = await renderButtons();

    await expect
      .element(screen.getByRole("button", { name: "Go back" }))
      .toBeDisabled();

    await expect
      .element(screen.getByRole("button", { name: "Go home" }))
      .toBeDisabled();
  });

  test.each([
    { direction: "rtl", transform: "matrix(-1, 0, 0, 1, 0, 0)" },
    { direction: "ltr", transform: "none" },
  ] as const)(
    "points the back arrow toward the reading start in $direction",
    async ({ direction, transform }) => {
      const { screen } = await renderButtons({ direction });
      const icon = screen
        .getByRole("button", { name: "Go back" })
        .element()
        .querySelector("svg");

      assertDefined(icon);
      expect(getComputedStyle(icon).transform).toBe(transform);
    },
  );
});
