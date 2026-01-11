import * as boardsDB from "@features/board/db/boards-db";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useBoardNavigation } from "./useBoardNavigation";

vi.mock("@features/board/db/boards-db", () => ({
  getBoardSet: vi.fn(),
  openBoardsDB: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function createWrapper(initialSetId = "set-1", initialBoardId = "board-1") {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter
        initialEntries={[`/sets/${initialSetId}/boards/${initialBoardId}`]}
      >
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

describe("useBoardNavigation", () => {
  let mockDB: { close: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    vi.clearAllMocks();
    mockDB = {
      close: vi.fn(),
    };
    vi.mocked(boardsDB.openBoardsDB).mockResolvedValue(mockDB as never);
    vi.mocked(boardsDB.getBoardSet).mockResolvedValue({
      id: "set-1",
      rootBoardId: "root-1",
    } as never);
  });

  test("initializes with current boardId in navigation history", async () => {
    const { result } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    expect(result.current.history).toEqual(["board-1"]);
    expect(result.current.canGoBack).toBe(false);
  });

  test("goToBoard appends new board to history and navigates", async () => {
    const { result, act } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    await act(() => {
      result.current.goToBoard("board-2");
    });

    expect(result.current.history).toEqual(["board-1", "board-2"]);
    expect(result.current.canGoBack).toBe(true);
    expect(mockNavigate).toHaveBeenCalledWith("/sets/set-1/boards/board-2");
  });

  test("goToBoard ignores empty or duplicate board id", async () => {
    const { result, act } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    await act(() => {
      result.current.goToBoard("");
    });

    expect(result.current.history).toEqual(["board-1"]);
    expect(mockNavigate).not.toHaveBeenCalled();

    await act(() => {
      result.current.goToBoard("board-1");
    });

    expect(result.current.history).toEqual(["board-1"]);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("goBack moves to previous board in history", async () => {
    const { result, act } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    await act(() => {
      result.current.goToBoard("board-2");
    });

    mockNavigate.mockClear();

    await act(() => {
      result.current.goBack();
    });

    expect(result.current.history).toEqual(["board-1", "board-2"]);
    expect(result.current.canGoBack).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/sets/set-1/boards/board-1");
  });

  test("goBack does nothing when at start of history", async () => {
    const { result, act } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    await act(() => {
      result.current.goBack();
    });

    expect(result.current.history).toEqual(["board-1"]);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("goToBoard truncates forward history when navigating from middle", async () => {
    const { result, act } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    await act(() => {
      result.current.goToBoard("board-2");
    });
    await act(() => {
      result.current.goToBoard("board-3");
    });

    expect(result.current.canGoBack).toBe(true);

    mockNavigate.mockClear();

    await act(() => {
      result.current.goBack();
    });

    expect(result.current.canGoBack).toBe(true);

    expect(result.current.history).toEqual(["board-1", "board-2", "board-3"]);
    expect(mockNavigate).toHaveBeenCalledWith("/sets/set-1/boards/board-2");

    mockNavigate.mockClear();

    await act(() => {
      result.current.goToBoard("board-4");
    });

    expect(result.current.history).toEqual(["board-1", "board-2", "board-4"]);
    expect(mockNavigate).toHaveBeenCalledWith("/sets/set-1/boards/board-4");
  });

  test("canGoHome returns true when root board is loaded", async () => {
    const { result } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    await vi.waitFor(() => {
      expect(result.current.canGoHome).toBe(true);
    });
  });

  test("canGoHome returns false when root board is not available", async () => {
    vi.mocked(boardsDB.getBoardSet).mockResolvedValue(null);

    const { result } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    await vi.waitFor(() => {
      expect(result.current.canGoHome).toBe(false);
    });
  });

  test("goHome resets to root board", async () => {
    const { result, act } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    await vi.waitFor(() => {
      expect(result.current.canGoHome).toBe(true);
    });

    await act(() => {
      result.current.goToBoard("board-2");
    });
    await act(() => {
      result.current.goToBoard("board-3");
    });

    mockNavigate.mockClear();

    await act(() => {
      result.current.goHome();
    });

    expect(result.current.history).toEqual(["root-1"]);
    expect(result.current.canGoBack).toBe(false);
    expect(mockNavigate).toHaveBeenCalledWith("/sets/set-1/boards/root-1");
  });

  test("goHome does nothing when rootBoardId is not loaded", async () => {
    vi.mocked(boardsDB.getBoardSet).mockResolvedValue(null);

    const { result, act } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    await vi.waitFor(() => {
      expect(result.current.canGoHome).toBe(false);
    });

    expect(result.current.history).toEqual(["board-1"]);

    await act(() => {
      result.current.goHome();
    });

    expect(result.current.history).toEqual(["board-1"]);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("goToBoard does nothing when setId is missing", async () => {
    function WrapperWithBoardOnlyParam({ children }: { children: ReactNode }) {
      return (
        <MemoryRouter initialEntries={["/boards/board-1"]}>
          <Routes>
            <Route path="/boards/:boardId" element={<>{children}</>} />
          </Routes>
        </MemoryRouter>
      );
    }

    const { result, act } = await renderHook(() => useBoardNavigation(), {
      wrapper: WrapperWithBoardOnlyParam,
    });

    expect(result.current.history).toEqual(["board-1"]);

    await act(() => {
      result.current.goToBoard("board-2");
    });

    expect(result.current.history).toEqual(["board-1"]);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("loads root board from database on mount", async () => {
    const { result } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    await vi.waitFor(() => {
      expect(result.current.canGoHome).toBe(true);
    });

    expect(boardsDB.openBoardsDB).toHaveBeenCalled();
    expect(boardsDB.getBoardSet).toHaveBeenCalledWith(mockDB, "set-1");
    await vi.waitFor(() => {
      expect(mockDB.close).toHaveBeenCalled();
    });
  });

  test("handles database error when loading root board", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {
        // Suppress console output during test
      });
    vi.mocked(boardsDB.getBoardSet).mockRejectedValue(new Error("DB error"));

    const { result } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    await vi.waitFor(() => {
      expect(mockDB.close).toHaveBeenCalled();
    });

    expect(result.current.canGoHome).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to load board:",
      expect.any(Error),
    );

    consoleErrorSpy.mockRestore();
  });

  test("does not load root board when setId is missing", async () => {
    function WrapperWithoutParams({ children }: { children: ReactNode }) {
      return (
        <MemoryRouter initialEntries={["/other"]}>
          <Routes>
            <Route path="/other" element={<>{children}</>} />
          </Routes>
        </MemoryRouter>
      );
    }

    const { result } = await renderHook(() => useBoardNavigation(), {
      wrapper: WrapperWithoutParams,
    });

    expect(boardsDB.openBoardsDB).not.toHaveBeenCalled();
    expect(result.current.canGoHome).toBe(false);
    expect(result.current.history).toEqual([]);
  });
});
