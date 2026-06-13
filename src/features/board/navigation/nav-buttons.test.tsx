import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { describe, expect, test, vi } from "vitest";
import { assertDefined } from "@shared/testing/assert-defined";
import { render } from "vitest-browser-react";
import { NavButtons } from "./nav-buttons";

function renderWithDirection(
  direction: "ltr" | "rtl",
  props: {
    canGoBack?: boolean;
    canGoHome?: boolean;
    onBackClick?: () => void;
    onHomeClick?: () => void;
  } = {},
) {
  const theme = createTheme({ direction });
  const {
    canGoBack = true,
    canGoHome = true,
    onBackClick = vi.fn(),
    onHomeClick = vi.fn(),
  } = props;

  return render(
    <MUIThemeProvider theme={theme}>
      <NavButtons
        canGoBack={canGoBack}
        canGoHome={canGoHome}
        onBackClick={onBackClick}
        onHomeClick={onHomeClick}
      />
    </MUIThemeProvider>,
  );
}

describe("NavButtons", () => {
  test("calls onBackClick when back button is clicked", async () => {
    const onBackClick = vi.fn();
    const onHomeClick = vi.fn();

    const screen = await render(
      <NavButtons
        canGoBack={true}
        canGoHome={true}
        onBackClick={onBackClick}
        onHomeClick={onHomeClick}
      />,
    );

    await screen.getByRole("button", { name: "Back" }).click();

    expect(onBackClick).toHaveBeenCalledOnce();
    expect(onHomeClick).not.toHaveBeenCalled();
  });

  test("calls onHomeClick when home button is clicked", async () => {
    const onBackClick = vi.fn();
    const onHomeClick = vi.fn();

    const screen = await render(
      <NavButtons
        canGoBack={true}
        canGoHome={true}
        onBackClick={onBackClick}
        onHomeClick={onHomeClick}
      />,
    );

    await screen.getByRole("button", { name: "Home" }).click();

    expect(onHomeClick).toHaveBeenCalledOnce();
    expect(onBackClick).not.toHaveBeenCalled();
  });

  test("disables back button when canGoBack is false", async () => {
    const screen = await render(
      <NavButtons
        canGoBack={false}
        canGoHome={true}
        onBackClick={vi.fn()}
        onHomeClick={vi.fn()}
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Back" }))
      .toBeDisabled();

    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toBeEnabled();
  });

  test("disables home button when canGoHome is false", async () => {
    const screen = await render(
      <NavButtons
        canGoBack={true}
        canGoHome={false}
        onBackClick={vi.fn()}
        onHomeClick={vi.fn()}
      />,
    );

    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toBeDisabled();

    await expect
      .element(screen.getByRole("button", { name: "Back" }))
      .toBeEnabled();
  });

  describe("RTL icon mirroring", () => {
    test("back arrow is flipped in RTL", async () => {
      const screen = await renderWithDirection("rtl");

      const backButton = screen.getByRole("button", { name: "Back" });
      const icon = backButton.element().querySelector("svg");

      assertDefined(icon);
      // Browsers resolve scaleX(-1) to its matrix equivalent
      const styles = getComputedStyle(icon);
      expect(styles.transform).toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });

    test("back arrow is not flipped in LTR", async () => {
      const screen = await renderWithDirection("ltr");

      const backButton = screen.getByRole("button", { name: "Back" });
      const icon = backButton.element().querySelector("svg");

      assertDefined(icon);
      const styles = getComputedStyle(icon);
      expect(styles.transform).not.toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });

    test("home icon is not flipped in RTL", async () => {
      const screen = await renderWithDirection("rtl");

      const homeButton = screen.getByRole("button", { name: "Home" });
      const icon = homeButton.element().querySelector("svg");

      assertDefined(icon);
      const styles = getComputedStyle(icon);
      expect(styles.transform).not.toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });
  });
});
