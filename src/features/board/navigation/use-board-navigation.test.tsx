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
  state?: unknown;
  rootBoardId?: string;
}

function setup(
  options: SetupOptions = {},
): Promise<RenderHookResult<NavTestHook, unknown>> {
  const {
    pathname = DEFAULT_PATH,
    state,
    rootBoardId,
  } = { rootBoardId: "root-1", ...options };

  return renderHook(
    (): NavTestHook => ({
      nav: useBoardNavigation(rootBoardId),
      location: useLocation(),
      navigate: useNavigate(),
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[{ pathname, state }]}>
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
  describe("canGoBack", () => {
    test("is false when the route has no board history", async () => {
      const { result } = await setup();

      expect(result.current.nav.canGoBack).toBe(false);
    });

    test("is true when a board navigation enables Back", async () => {
      const { result } = await setup({
        pathname: "/sets/set-1/boards/board-2",
        state: { canGoBack: true },
      });

      expect(result.current.nav.canGoBack).toBe(true);
    });

    test.each([
      null,
      "history",
      {},
      { canGoBack: "true" },
      { canGoBack: false },
    ])("ignores disabled or malformed history state %j", async (state) => {
      const { result } = await setup({ state });

      expect(result.current.nav.canGoBack).toBe(false);
    });
  });

  describe("canGoHome", () => {
    test("is true when the root board is known", async () => {
      const { result } = await setup();

      expect(result.current.nav.canGoHome).toBe(true);
    });

    test("is false when the root board is unknown", async () => {
      const { result } = await setup({ rootBoardId: undefined });

      expect(result.current.nav.canGoHome).toBe(false);
    });
  });

  describe("goToBoard", () => {
    test("navigates and enables board Back", async () => {
      const { result, act } = await setup();

      await act(() => result.current.nav.goToBoard("board-2"));

      expect(result.current.location.pathname).toBe(
        "/sets/set-1/boards/board-2",
      );
      expect(result.current.location.state).toEqual({ canGoBack: true });
    });

    test("keeps Back enabled through successive board navigations", async () => {
      const { result, act } = await setup({
        pathname: "/sets/set-1/boards/board-2",
        state: { canGoBack: true },
      });

      await act(() => result.current.nav.goToBoard("board-3"));

      expect(result.current.location.pathname).toBe(
        "/sets/set-1/boards/board-3",
      );
      expect(result.current.location.state).toEqual({
        canGoBack: true,
      });
    });

    test("ignores an empty board id", async () => {
      const { result, act } = await setup();

      await act(() => result.current.nav.goToBoard(""));

      expect(result.current.location.pathname).toBe(DEFAULT_PATH);
      expect(result.current.location.state).toBeNull();
    });

    test("ignores navigation to the current board", async () => {
      const { result, act } = await setup();

      await act(() => result.current.nav.goToBoard("board-1"));

      expect(result.current.location.state).toBeNull();
    });
  });

  describe("goBack", () => {
    test("returns to the previous board after navigating forward", async () => {
      const { result, act } = await setup();

      await act(() => result.current.nav.goToBoard("board-2"));

      expect(result.current.location.pathname).toBe(
        "/sets/set-1/boards/board-2",
      );

      await act(() => result.current.nav.goBack());

      expect(result.current.location.pathname).toBe(DEFAULT_PATH);
      expect(result.current.nav.canGoBack).toBe(false);

      await act(() => result.current.navigate(1));

      expect(result.current.location.pathname).toBe(
        "/sets/set-1/boards/board-2",
      );
      expect(result.current.nav.canGoBack).toBe(true);
    });

    test("does nothing when the route has no board history", async () => {
      const { result, act } = await setup();

      await act(() => result.current.nav.goBack());

      expect(result.current.location.pathname).toBe(DEFAULT_PATH);
    });
  });

  describe("goHome", () => {
    test("navigates to the root board and disables board Back", async () => {
      const { result, act } = await setup({
        pathname: "/sets/set-1/boards/board-2",
        state: { canGoBack: true },
      });

      await act(() => result.current.nav.goHome());

      expect(result.current.location.pathname).toBe(
        "/sets/set-1/boards/root-1",
      );
      expect(result.current.location.state).toEqual({ canGoBack: false });
    });

    test("replaces the current entry so browser back skips it", async () => {
      const { result, act } = await setup({
        pathname: "/sets/set-1/boards/board-2",
        state: { canGoBack: true },
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
      const { result, act } = await setup({ rootBoardId: undefined });

      await act(() => result.current.nav.goHome());

      expect(result.current.location.pathname).toBe(DEFAULT_PATH);
    });
  });
});
