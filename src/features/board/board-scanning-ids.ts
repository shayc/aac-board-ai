export const BACK_SCAN_ID = "board-navigation-back";
export const BACKSPACE_SCAN_ID = "board-message-backspace";
export const HOME_SCAN_ID = "board-navigation-home";
export const PLAY_SCAN_ID = "board-message-play";
export const SUGGESTIONS_ENABLE_SCAN_ID = "board-suggestions-enable";

export function getTileScanId(boardId: string, buttonId: string): string {
  return `board-button:${boardId}:${buttonId}`;
}

export function getRowScanId(boardId: string, rowIndex: number): string {
  return `board-row:${boardId}:${rowIndex}`;
}

export function getSuggestionScanId(boardId: string, phrase: string): string {
  return `board-suggestion:${boardId}:${phrase}`;
}
