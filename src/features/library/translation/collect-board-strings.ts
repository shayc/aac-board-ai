import type { StoredBoard } from "../board-types";

export function collectBoardStrings(board: StoredBoard): Set<string> {
  const strings = new Set<string>();

  if (board.name) {
    strings.add(board.name);
  }

  for (const button of board.buttons) {
    if (button.label) {
      strings.add(button.label);
    }

    if (button.vocalization) {
      strings.add(button.vocalization);
    }
  }

  return strings;
}
