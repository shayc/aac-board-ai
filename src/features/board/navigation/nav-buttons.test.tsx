import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { AppProviders } from "@shared/providers/app-providers";
import { createMemoryRouter, type InitialEntry } from "react-router";
import { RouterProvider } from "react-router/dom";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { assertDefined } from "@shared/testing/assert-defined";
import { render } from "vitest-browser-react";
import { seedBoardSets } from "../testing";
import { NavButtons } from "./nav-buttons";

async function renderAt(
  initialEntries: InitialEntry[],
  options: {
    initialIndex?: number;
    direction?: "ltr" | "rtl";
    onBack?: () => void;
    onHome?: () => void;
  } = {},
) {
  const theme = createTheme({ direction: options.direction ?? "ltr" });

  const router = createMemoryRouter(
    [
      {
        path: "/sets/:setId/boards/:boardId",
        element: <NavButtons onBack={options.onBack} onHome={options.onHome} />,
      },
    ],
    { initialEntries, initialIndex: options.initialIndex },
  );

  const screen = await render(
    <AppProviders>
      <MUIThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </MUIThemeProvider>
    </AppProviders>,
  );

  return { router, screen };
}

describe("NavButtons", () => {
  beforeEach(async () => {
    await seedBoardSets([{ setId: "set-1", rootBoardId: "root-1" }]);
  });

  test("navigates back to the previous board when the back button is clicked", async () => {
    const onBack = vi.fn();
    const { router, screen } = await renderAt(
      [
        "/sets/set-1/boards/root-1",
        {
          pathname: "/sets/set-1/boards/board-2",
          state: { backStack: ["root-1"] },
        },
      ],
      { initialIndex: 1, onBack },
    );

    await screen.getByRole("button", { name: "Back" }).click();

    expect(onBack).toHaveBeenCalledOnce();
    await expect
      .poll(() => router.state.location.pathname)
      .toBe("/sets/set-1/boards/root-1");
  });

  test("runs the Home callback and navigates home", async () => {
    const onHome = vi.fn();
    const { router, screen } = await renderAt(
      [{ pathname: "/sets/set-1/boards/board-2", state: { backStack: [] } }],
      { onHome },
    );

    await screen.getByRole("button", { name: "Home" }).click();

    expect(onHome).toHaveBeenCalledOnce();
    await expect
      .poll(() => router.state.location.pathname)
      .toBe("/sets/set-1/boards/root-1");
  });

  test("disables navigation buttons on the home board", async () => {
    const { screen } = await renderAt(["/sets/set-1/boards/root-1"]);

    await expect
      .element(screen.getByRole("button", { name: "Back" }))
      .toBeDisabled();

    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toBeDisabled();
  });

  test("disables home button when the board set has no root board", async () => {
    await seedBoardSets([]);

    const { screen } = await renderAt(["/sets/set-1/boards/board-1"]);

    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toBeDisabled();
  });

  describe("RTL icon mirroring", () => {
    test("back arrow is flipped in RTL", async () => {
      const { screen } = await renderAt(["/sets/set-1/boards/root-1"], {
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
      const { screen } = await renderAt(["/sets/set-1/boards/root-1"]);

      const backButton = screen.getByRole("button", { name: "Back" });
      const icon = backButton.element().querySelector("svg");

      assertDefined(icon);
      const styles = getComputedStyle(icon);
      expect(styles.transform).not.toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });

    test("home icon is not flipped in RTL", async () => {
      const { screen } = await renderAt(["/sets/set-1/boards/root-1"], {
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
