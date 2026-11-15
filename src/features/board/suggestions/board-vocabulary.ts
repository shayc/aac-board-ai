import type { Board, BoardButton } from "@features/library";

/**
 * The board's word tiles in reading order, keyed by label. Folder and action
 * tiles say nothing when tapped, so they are never a next word.
 */
export function boardVocabulary(
  board: Board,
): ReadonlyMap<string, BoardButton> {
  const buttonsById = new Map(
    board.buttons.map((button) => [button.id, button]),
  );
  const vocabulary = new Map<string, BoardButton>();

  for (const id of board.grid.order.flat()) {
    const button = id === null ? undefined : buttonsById.get(id);
    const label = button?.label.trim();
    if (!button || !label || !isWordTile(button) || vocabulary.has(label)) {
      continue;
    }

    vocabulary.set(label, button);
  }

  return vocabulary;
}

function isWordTile(button: BoardButton): boolean {
  return button.linkedBoardId === undefined && button.actions.length === 0;
}
