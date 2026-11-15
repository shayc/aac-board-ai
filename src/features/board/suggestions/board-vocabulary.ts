import type { Board, BoardButton } from "@features/library";

/** The board's word tiles in reading order, one per label. Action tiles have no word to predict. */
export function boardVocabulary(board: Board): BoardButton[] {
  const buttonsById = new Map(
    board.buttons.map((button) => [button.id, button]),
  );
  const orderedButtons = board.grid.order
    .flat()
    .map((id) => (id === null ? undefined : buttonsById.get(id)))
    .filter((button) => button !== undefined);
  const seenLabels = new Set<string>();

  return orderedButtons.filter((button) => {
    const label = button.label.trim();
    if (label === "" || button.actions.length > 0 || seenLabels.has(label)) {
      return false;
    }

    seenLabels.add(label);

    return true;
  });
}
