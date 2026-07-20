import type { Board, BoardSummary } from "@features/board";

export function resolveBoardSelectorOptions(
  boards: BoardSummary[],
  activeBoard: Board | undefined,
  language: string,
): BoardSummary[] {
  const activeBoardName = activeBoard?.name;
  if (!activeBoardName) {
    return boards;
  }

  const options = boards.map((board) =>
    board.boardId === activeBoard.id
      ? { ...board, name: activeBoardName }
      : board,
  );

  return options.sort((a, b) => a.name.localeCompare(b.name, language));
}
