import type { Board, BoardButton } from "@features/library";

export interface WordTile {
  boardId: string;
  button: BoardButton;
}

/**
 * The word tiles within one tap, keyed by label: the board in view in reading
 * order, then the nearby boards. Folder and action tiles say nothing when
 * tapped, so they are never a next word. A label keeps the first tile that
 * carries it, so the board in view wins.
 */
export function nearbyVocabulary(
  board: Board,
  nearbyBoards: readonly Board[],
): ReadonlyMap<string, WordTile> {
  const vocabulary = new Map<string, WordTile>();

  for (const { id: boardId, buttons, grid } of [board, ...nearbyBoards]) {
    const buttonsById = new Map(buttons.map((button) => [button.id, button]));

    for (const id of grid.order.flat()) {
      const button = id === null ? undefined : buttonsById.get(id);
      const label = button?.label.trim();
      if (!button || !label || !isWordTile(button) || vocabulary.has(label)) {
        continue;
      }

      vocabulary.set(label, { boardId, button });
    }
  }

  return vocabulary;
}

function isWordTile(button: BoardButton): boolean {
  return button.linkedBoardId === undefined && button.actions.length === 0;
}
