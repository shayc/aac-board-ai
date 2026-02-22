import * as boardSetsStore from "@features/board/store/board-sets-store";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useBoardNavigation } from "./useBoardNavigation";

vi.mock("@features/board/store/board-sets-store", () => ({
  subscribeBoardSets: vi.fn(),
  getBoardSetsSnapshot: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function createWrapper(
  initialSetId = "set-1",
  initialBoardId = "board-1",
  state?: { backStack: string[] },
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const entry = {
      pathname: `/sets/${initialSetId}/boards/${initialBoardId}`,
      state,
    };

    return (
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route
            path="/sets/:setId/boards/:boardId"
            element={<>{children}</>}
          />
        </Routes>
      </MemoryRouter>
    );
  };
}

function createWrapperWithoutSetId(state?: { backStack: string[] }) {
  return function WrapperWithoutSetId({ children }: { children: ReactNode }) {
    const entry = { pathname: "/boards/board-1", state };

    return (
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/boards/:boardId" element={<>{children}</>} />
        </Routes>
      </MemoryRouter>
    );
  };
}

describe("useBoardNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(boardSetsStore.subscribeBoardSets).mockImplementation(() => {
      return () => undefined;
    });
    vi.mocked(boardSetsStore.getBoardSetsSnapshot).mockReturnValue({
      boardSets: [
        {
          setId: "set-1",
          name: "Set 1",
          rootBoardId: "root-1",
          updatedAt: Date.now(),
          boardCount: 1,
        },
      ],
      isLoading: false,
      error: null,
    });
  });

  describe("canGoBack", () => {
    test("is false when backStack is empty", async () => {
      const { result } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-1"),
      });

      expect(result.current.canGoBack).toBe(false);
    });

    test("is true when backStack has entries", async () => {
      const { result } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-2", {
          backStack: ["board-1"],
        }),
      });

      expect(result.current.canGoBack).toBe(true);
    });
  });

  describe("canGoHome", () => {
    test("is true when root board is loaded", async () => {
      const { result } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-1"),
      });

      expect(result.current.canGoHome).toBe(true);
    });

    test("is false when root board is not available", async () => {
      vi.mocked(boardSetsStore.getBoardSetsSnapshot).mockReturnValue({
        boardSets: [
          {
            setId: "set-1",
            name: "Set 1",
            rootBoardId: "",
            updatedAt: Date.now(),
            boardCount: 1,
          },
        ],
        isLoading: false,
        error: null,
      });

      const { result } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-1"),
      });

      expect(result.current.canGoHome).toBe(false);
    });

    test("is false when board set is missing", async () => {
      vi.mocked(boardSetsStore.getBoardSetsSnapshot).mockReturnValue({
        boardSets: [],
        isLoading: false,
        error: null,
      });

      const { result } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-1"),
      });

      expect(result.current.canGoHome).toBe(false);
    });
  });

  describe("goToBoard", () => {
    test("navigates with backStack in state", async () => {
      const { result, act } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-1"),
      });

      await act(() => {
        result.current.goToBoard("board-2");
      });

      expect(mockNavigate).toHaveBeenCalledWith("/sets/set-1/boards/board-2", {
        state: { backStack: ["board-1"] },
      });
    });

    test("appends current board to existing backStack", async () => {
      const { result, act } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-2", {
          backStack: ["board-1"],
        }),
      });

      await act(() => {
        result.current.goToBoard("board-3");
      });

      expect(mockNavigate).toHaveBeenCalledWith("/sets/set-1/boards/board-3", {
        state: { backStack: ["board-1", "board-2"] },
      });
    });

    test("ignores empty board id", async () => {
      const { result, act } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-1"),
      });

      await act(() => {
        result.current.goToBoard("");
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("ignores duplicate board id", async () => {
      const { result, act } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-1"),
      });

      await act(() => {
        result.current.goToBoard("board-1");
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("does nothing when setId is missing", async () => {
      const { result, act } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapperWithoutSetId(),
      });

      await act(() => {
        result.current.goToBoard("board-2");
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("goBack", () => {
    test("returns to previous board", async () => {
      const { result, act } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-2", {
          backStack: ["board-1"],
        }),
      });

      await act(() => {
        result.current.goBack();
      });

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test("does nothing when backStack is empty", async () => {
      const { result, act } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-1"),
      });

      await act(() => {
        result.current.goBack();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("does nothing when setId is missing", async () => {
      const { result, act } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapperWithoutSetId({ backStack: ["board-1"] }),
      });

      await act(() => {
        result.current.goBack();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("goHome", () => {
    test("navigates to root board with replace", async () => {
      const { result, act } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-2", {
          backStack: ["board-1"],
        }),
      });

      await act(() => {
        result.current.goHome();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/sets/set-1/boards/root-1", {
        state: { backStack: [] },
        replace: true,
      });
    });

    test("does nothing when rootBoardId is not loaded", async () => {
      vi.mocked(boardSetsStore.getBoardSetsSnapshot).mockReturnValue({
        boardSets: [],
        isLoading: false,
        error: null,
      });

      const { result, act } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapper("set-1", "board-1"),
      });

      await act(() => {
        result.current.goHome();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test("does nothing when setId is missing", async () => {
      const { result, act } = await renderHook(() => useBoardNavigation(), {
        wrapper: createWrapperWithoutSetId(),
      });

      await act(() => {
        result.current.goHome();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
