import type { ReactNode } from "react";
import {
  type Location,
  MemoryRouter,
  type NavigateFunction,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router";
import { describe, expect, test } from "vitest";
import { renderHook, type RenderHookResult } from "vitest-browser-react";
import {
  useBoardNavigation,
  type UseBoardNavigationReturn,
} from "./use-board-navigation";

const DEFAULT_PATH = "/sets/set-1/boards/board-1";

interface NavTestHook {
  nav: UseBoardNavigationReturn;
  location: Location;
  navigate: NavigateFunction;
}

interface SetupOptions {
  pathname?: string;
  hasRootBoard?: boolean;
}

function setup({
  pathname = DEFAULT_PATH,
  hasRootBoard = true,
}: SetupOptions = {}): Promise<RenderHookResult<NavTestHook, unknown>> {
  return renderHook(
    (): NavTestHook => ({
      nav: useBoardNavigation(hasRootBoard ? "root-1" : undefined),
      location: useLocation(),
      navigate: useNavigate(),
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[pathname]}>
          <Routes>
            <Route
              path="/sets/:boardSetId/boards/:boardId"
              element={<>{children}</>}
            />
          </Routes>
        </MemoryRouter>
      ),
    },
  );
}

describe("useBoardNavigation", () => {
  describe("canGoHome", () => {
    test("is true when the root board is known", async () => {
      const { result } = await setup();

      expect(result.current.nav.canGoHome).toBe(true);
    });

    test("is false on the root board", async () => {
      const { result } = await setup({ pathname: "/sets/set-1/boards/root-1" });

      expect(result.current.nav.canGoHome).toBe(false);
    });

    test("is false when the root board is unknown", async () => {
      const { result } = await setup({ hasRootBoard: false });

      expect(result.current.nav.canGoHome).toBe(false);
    });
  });

  describe("goToBoard", () => {
    test("navigates to the board", async () => {
      const { result, act } = await setup();

      await act(() => result.current.nav.goToBoard("board-2"));

      expect(result.current.location.pathname).toBe(
        "/sets/set-1/boards/board-2",
      );
    });

    test.each(["", "board-1"])(
      "ignores the board ID %j",
      async (targetBoardId) => {
        const { result, act } = await setup();
        const { key } = result.current.location;

        await act(() => result.current.nav.goToBoard(targetBoardId));

        expect(result.current.location.key).toBe(key);
      },
    );
  });

  describe("goHome", () => {
    test("navigates to the root board", async () => {
      const { result, act } = await setup({
        pathname: "/sets/set-1/boards/board-2",
      });

      await act(() => result.current.nav.goHome());

      expect(result.current.location.pathname).toBe(
        "/sets/set-1/boards/root-1",
      );
    });

    test("replaces the current entry so browser back skips it", async () => {
      const { result, act } = await setup({
        pathname: "/sets/set-1/boards/board-2",
      });

      await act(() => result.current.nav.goToBoard("board-3"));

      expect(result.current.location.pathname).toBe(
        "/sets/set-1/boards/board-3",
      );

      await act(() => result.current.nav.goHome());

      expect(result.current.location.pathname).toBe(
        "/sets/set-1/boards/root-1",
      );

      await act(() => result.current.navigate(-1));

      expect(result.current.location.pathname).toBe(
        "/sets/set-1/boards/board-2",
      );
    });

    test("does nothing when the root board is unknown", async () => {
      const { result, act } = await setup({ hasRootBoard: false });

      await act(() => result.current.nav.goHome());

      expect(result.current.location.pathname).toBe(DEFAULT_PATH);
    });
  });
});
