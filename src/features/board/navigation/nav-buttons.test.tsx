import {
  createTheme,
  ThemeProvider as MUIThemeProvider,
} from "@mui/material/styles";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, test } from "vitest";
import { assertDefined } from "@shared/testing/assert-defined";
import { render } from "vitest-browser-react";
import { seedBoardSets } from "../storage/test-utils";
import { NavButtons } from "./nav-buttons";

function renderAt(
  pathname: string,
  options: {
    state?: { backStack: string[] };
    direction?: "ltr" | "rtl";
  } = {},
) {
  const theme = createTheme({ direction: options.direction ?? "ltr" });

  return render(
    <MUIThemeProvider theme={theme}>
      <MemoryRouter initialEntries={[{ pathname, state: options.state }]}>
        <Routes>
          <Route path="/sets/:setId/boards/:boardId" element={<NavButtons />} />
        </Routes>
      </MemoryRouter>
    </MUIThemeProvider>,
  );
}

describe("NavButtons", () => {
  beforeEach(async () => {
    await seedBoardSets([{ setId: "set-1", rootBoardId: "root-1" }]);
  });

  test("calls goBack when back button is clicked", async () => {
    const screen = await renderAt("/sets/set-1/boards/board-2", {
      state: { backStack: ["root-1"] },
    });

    await screen.getByRole("button", { name: "Back" }).click();

    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toBeInTheDocument();
  });

  test("disables back button when there is no back stack", async () => {
    const screen = await renderAt("/sets/set-1/boards/root-1");

    await expect
      .element(screen.getByRole("button", { name: "Back" }))
      .toBeDisabled();

    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toBeEnabled();
  });

  test("disables home button when the board set has no root board", async () => {
    await seedBoardSets([]);

    const screen = await renderAt("/sets/set-1/boards/board-1");

    await expect
      .element(screen.getByRole("button", { name: "Home" }))
      .toBeDisabled();
  });

  describe("RTL icon mirroring", () => {
    test("back arrow is flipped in RTL", async () => {
      const screen = await renderAt("/sets/set-1/boards/root-1", {
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
      const screen = await renderAt("/sets/set-1/boards/root-1");

      const backButton = screen.getByRole("button", { name: "Back" });
      const icon = backButton.element().querySelector("svg");

      assertDefined(icon);
      const styles = getComputedStyle(icon);
      expect(styles.transform).not.toBe("matrix(-1, 0, 0, 1, 0, 0)");
    });

    test("home icon is not flipped in RTL", async () => {
      const screen = await renderAt("/sets/set-1/boards/root-1", {
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
