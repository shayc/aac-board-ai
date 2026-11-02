import { m } from "@paraglide/messages.js";
import { setStoredLanguage } from "@shared/language/language-store";
import { AppProviders } from "@shared/providers/app-providers";
import { assertDefined } from "@shared/testing/assert-defined";
import { describe, expect, test, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { NavigationButtons } from "./navigation-buttons";

interface RenderOptions {
  canGoBack?: boolean;
  canGoHome?: boolean;
  direction?: "ltr" | "rtl";
  mode?: "light" | "dark";
  onBack?: () => void;
  onHome?: () => void;
}

async function renderButtons(options: RenderOptions = {}) {
  setStoredLanguage(options.direction === "rtl" ? "he" : "en");
  localStorage.setItem("mui-mode", options.mode ?? "light");

  const onBack = options.onBack ?? vi.fn();
  const onHome = options.onHome ?? vi.fn();

  const screen = await render(
    <AppProviders>
      <NavigationButtons
        canGoBack={options.canGoBack ?? false}
        canGoHome={options.canGoHome ?? false}
        onBack={onBack}
        onHome={onHome}
      />
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

  test.each(["light", "dark"] as const)(
    "disables unavailable navigation actions in %s mode",
    async (mode) => {
      const { screen } = await renderButtons({ mode });

      await expect
        .element(screen.getByRole("button", { name: "Go back" }))
        .toBeDisabled();

      await expect
        .element(screen.getByRole("button", { name: "Go home" }))
        .toBeDisabled();
    },
  );

  test.each(["ltr", "rtl"] as const)(
    "shares one light-mode surface and preserves keyboard focus in %s",
    async (direction) => {
      const { screen } = await renderButtons({
        canGoBack: true,
        canGoHome: true,
        direction,
      });
      const backButton = screen.getByRole("button", { name: m.navBack() });
      const homeButton = screen.getByRole("button", { name: m.navHome() });

      expect(
        getComputedStyle(screen.getByRole("group").element()).boxShadow,
      ).not.toBe("none");
      expect(getComputedStyle(backButton.element()).boxShadow).toBe("none");
      expect(getComputedStyle(homeButton.element()).boxShadow).toBe("none");
      expect(
        getComputedStyle(homeButton.element()).borderInlineStartColor,
      ).not.toBe("rgba(0, 0, 0, 0)");

      await userEvent.tab();

      await expect.element(backButton).toHaveFocus();
      expect(getComputedStyle(backButton.element()).outlineStyle).toBe("solid");

      await userEvent.tab();

      await expect.element(homeButton).toHaveFocus();
      expect(getComputedStyle(homeButton.element()).outlineStyle).toBe("solid");
    },
  );

  describe("RTL icon mirroring", () => {
    test("back arrow is flipped in RTL", async () => {
      const { screen } = await renderButtons({
        direction: "rtl",
      });

      const backButton = screen.getByRole("button", { name: m.navBack() });
      const icon = backButton.element().querySelector("svg");

      assertDefined(icon);
      // Browsers resolve scaleX(-1) to its matrix equivalent
      const styles = getComputedStyle(icon);
      expect(styles.transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });

    test("back arrow is not flipped in LTR", async () => {
      const { screen } = await renderButtons();

      const backButton = screen.getByRole("button", { name: "Go back" });
      const icon = backButton.element().querySelector("svg");

      assertDefined(icon);
      const styles = getComputedStyle(icon);
      expect(styles.transform).not.toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });

    test("home icon is not flipped in RTL", async () => {
      const { screen } = await renderButtons({
        direction: "rtl",
      });

      const homeButton = screen.getByRole("button", { name: m.navHome() });
      const icon = homeButton.element().querySelector("svg");

      assertDefined(icon);
      const styles = getComputedStyle(icon);
      expect(styles.transform).not.toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });
  });
});
