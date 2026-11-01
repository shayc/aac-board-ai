import type { ReactNode } from "react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
  type Location,
  type NavigateFunction,
} from "react-router";
import { beforeEach, describe, expect, test } from "vitest";
import { renderHook, type RenderHookResult } from "vitest-browser-react";
import { seedBoardSets } from "../testing";
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

function setup(
  pathname = DEFAULT_PATH,
  state?: unknown,
): Promise<RenderHookResult<NavTestHook, unknown>> {
  return renderHook(
    (): NavTestHook => ({
      nav: useBoardNavigation(),
      location: useLocation(),
      navigate: useNavigate(),
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={[{ pathname, state }]}>
          <Routes>
            <Route
              path="/sets/:setId/boards/:boardId"
              element={<>{children}</>}
            />
            <Route path="/boards/:boardId" element={<>{children}</>} />
          </Routes>
        </MemoryRouter>
      ),
    },
  );
}

describe("useBoardNavigation", () => {
  beforeEach(async () => {
    await seedBoardSets([{ id: "set-1", rootBoardId: "root-1" }]);
  });

  describe("canGoBack", () => {
    test("is false when the route has no board history", async () => {
      const { result } = await setup();

      expect(result.current.nav.canGoBack).toBe(false);
    });

    test("is true when a board navigation enables Back", async () => {
      const { result } = await setup("/sets/set-1/boards/board-2", {
        canGoBack: true,
      });

      expect(result.current.nav.canGoBack).toBe(true);
    });

    test.each([
      null,
      "history",
      { canGoBack: "true" },
      { canGoBack: false, backStack: ["board-1"] },
      { backStack: "board-1" },
      { backStack: [null, 1] },
    ])("ignores disabled or malformed history state %j", async (state) => {
      const { result } = await setup(DEFAULT_PATH, state);

      expect(result.current.nav.canGoBack).toBe(false);
    });

    test("accepts board history created before the flag was introduced", async () => {
      const { result, act } = await setup(DEFAULT_PATH, {
        backStack: ["root-1"],
      });

      expect(result.current.nav.canGoBack).toBe(true);

      await act(() => result.current.nav.goToBoard("board-2"));

      expect(result.current.location.state).toEqual({ canGoBack: true });
      await act(() => result.current.nav.goBack());

      expect(result.current.location.pathname).toBe(DEFAULT_PATH);
      expect(result.current.nav.canGoBack).toBe(true);
    });
  });

  describe("canGoHome", () => {
    test("is true when the board set has a root board", async () => {
      const { result } = await setup();

      expect(result.current.nav.canGoHome).toBe(true);
    });

    test("is false when the board set is missing", async () => {
      await seedBoardSets([]);

      const { result } = await setup();

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
      const { result, act } = await setup("/sets/set-1/boards/board-2", {
        canGoBack: true,
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

    test("does nothing when setId is missing from the route", async () => {
      const { result, act } = await setup("/boards/board-1");

      await act(() => result.current.nav.goToBoard("board-2"));

      expect(result.current.location.pathname).toBe("/boards/board-1");
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

    test("does nothing when setId is missing from the route", async () => {
      const { result, act } = await setup("/boards/board-1", {
        canGoBack: true,
      });

      await act(() => result.current.nav.goBack());

      expect(result.current.location.pathname).toBe("/boards/board-1");
    });
  });

  describe("goHome", () => {
    test("navigates to the root board and disables board Back", async () => {
      const { result, act } = await setup("/sets/set-1/boards/board-2", {
        canGoBack: true,
      });

      await act(() => result.current.nav.goHome());

      expect(result.current.location.pathname).toBe(
        "/sets/set-1/boards/root-1",
      );
      expect(result.current.location.state).toEqual({ canGoBack: false });
    });

    test("replaces the current entry so browser back skips it", async () => {
      const { result, act } = await setup("/sets/set-1/boards/board-2", {
        canGoBack: true,
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

    test("does nothing when the board set has no root board", async () => {
      await seedBoardSets([]);

      const { result, act } = await setup();

      await act(() => result.current.nav.goHome());

      expect(result.current.location.pathname).toBe(DEFAULT_PATH);
    });

    test("does nothing when setId is missing from the route", async () => {
      const { result, act } = await setup("/boards/board-1");

      await act(() => result.current.nav.goHome());

      expect(result.current.location.pathname).toBe("/boards/board-1");
    });
  });
});
