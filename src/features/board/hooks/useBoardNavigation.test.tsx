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
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(boardSetsStore.subscribeBoardSets).mockImplementation(() => {
      return () => undefined;
    });
    vi.mocked(boardSetsStore.getBoardSetsSnapshot).mockReturnValue({
      data: [
        {
          setId: "set-1",
          name: "Set 1",
          nameKey: "set 1",
          rootBoardId: "root-1",
          updatedAt: Date.now(),
          boardCount: 1,
        },
      ],
      isLoading: false,
    });
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

    expect(result.current.canGoHome).toBe(true);
  });

  test("canGoHome returns false when root board is not available", async () => {
    vi.mocked(boardSetsStore.getBoardSetsSnapshot).mockReturnValue({
      data: [
        {
          setId: "set-1",
          name: "Set 1",
          nameKey: "set 1",
          rootBoardId: "",
          updatedAt: Date.now(),
          boardCount: 1,
        },
      ],
      isLoading: false,
    });

    const { result } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    expect(result.current.canGoHome).toBe(false);
  });

  test("goHome resets to root board", async () => {
    const { result, act } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    expect(result.current.canGoHome).toBe(true);

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
    vi.mocked(boardSetsStore.getBoardSetsSnapshot).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result, act } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    expect(result.current.canGoHome).toBe(false);

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

  test("loads root board from store snapshot", async () => {
    const { result } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    expect(result.current.canGoHome).toBe(true);
    expect(boardSetsStore.getBoardSetsSnapshot).toHaveBeenCalled();
  });

  test("handles missing board set gracefully", async () => {
    vi.mocked(boardSetsStore.getBoardSetsSnapshot).mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { result } = await renderHook(() => useBoardNavigation(), {
      wrapper: createWrapper("set-1", "board-1"),
    });

    expect(result.current.canGoHome).toBe(false);
  });

  test("does not provide goHome when setId is missing", async () => {
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

    expect(result.current.canGoHome).toBe(false);
    expect(result.current.history).toEqual([]);
  });
});
