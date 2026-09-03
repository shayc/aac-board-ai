import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { AppProviders } from "@shared/providers/app-providers";
import { assertDefined } from "@shared/testing/assert-defined";
import { describe, expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { NavButtons } from "./nav-buttons";

interface RenderOptions {
  canGoBack?: boolean;
  canGoHome?: boolean;
  direction?: "ltr" | "rtl";
  onBack?: () => void;
  onHome?: () => void;
}

async function renderButtons(options: RenderOptions = {}) {
  const theme = createTheme({ direction: options.direction ?? "ltr" });
  const onBack = options.onBack ?? vi.fn();
  const onHome = options.onHome ?? vi.fn();

  const screen = await render(
    <AppProviders>
      <MUIThemeProvider theme={theme}>
        <NavButtons
          canGoBack={options.canGoBack ?? false}
          canGoHome={options.canGoHome ?? false}
          onBack={onBack}
          onHome={onHome}
        />
      </MUIThemeProvider>
    </AppProviders>,
  );

  return { onBack, onHome, screen };
}

describe("NavButtons", () => {
  test("calls onBack when the enabled back button is clicked", async () => {
    const onBack = vi.fn();
    const { screen } = await renderButtons({ canGoBack: true, onBack });

    await screen.getByRole("button", { name: "Back" }).click();

    expect(onBack).toHaveBeenCalledOnce();
  });

  test("calls onHome when the enabled home button is clicked", async () => {
    const onHome = vi.fn();
    const { screen } = await renderButtons({ canGoHome: true, onHome });

    await screen.getByRole("button", { name: "Home" }).click();

    expect(onHome).toHaveBeenCalledOnce();
  });

  test("disables unavailable navigation actions", async () => {
    const { screen } = await renderButtons();

    await expect
      .element(screen.getByRole("button", { name: "Back" }))
      .toBeDisabled();

    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toBeDisabled();
  });

  describe("RTL icon mirroring", () => {
    test("back arrow is flipped in RTL", async () => {
      const { screen } = await renderButtons({
        direction: "rtl",
      });

      const backButton = screen.getByRole("button", { name: "Back" });
      const icon = backButton.element().querySelector("svg");

      assertDefined(icon);
      // Browsers resolve scaleX(-1) to its matrix equivalent
      const styles = getComputedStyle(icon);
      expect(styles.transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });

    test("back arrow is not flipped in LTR", async () => {
      const { screen } = await renderButtons();

      const backButton = screen.getByRole("button", { name: "Back" });
      const icon = backButton.element().querySelector("svg");

      assertDefined(icon);
      const styles = getComputedStyle(icon);
      expect(styles.transform).not.toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });

    test("home icon is not flipped in RTL", async () => {
      const { screen } = await renderButtons({
        direction: "rtl",
      });

      const homeButton = screen.getByRole("button", { name: "Home" });
      const icon = homeButton.element().querySelector("svg");

      assertDefined(icon);
      const styles = getComputedStyle(icon);
      expect(styles.transform).not.toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });
  });
});
