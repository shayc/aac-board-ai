type BoardShortcutAction = "backspace" | "clear" | "undo" | "play" | "stop";

/**
 * `aria-keyshortcuts` for controls activated by a shortcut (`clear` is omitted
 * because Backspace clears only on long press).
 */
export const BOARD_SHORTCUT_ARIA_KEYS = {
  backspace: "Backspace",
  play: "Meta+Enter Control+Enter",
  stop: "Escape",
} as const;

export interface BoardShortcutKeyEvent {
  key: string;
  code: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
}

export function resolveBoardShortcut(
  event: BoardShortcutKeyEvent,
  isMessagePlaying: boolean,
): BoardShortcutAction | null {
  if (event.metaKey || event.ctrlKey) {
    if (event.key === "Enter") {
      return isMessagePlaying ? null : "play";
    }

    if (event.key === "Backspace") {
      return "clear";
    }

    if (isUndoKey(event)) {
      return "undo";
    }

    return null;
  }

  if (event.key === "Escape") {
    return isMessagePlaying ? "stop" : null;
  }

  if (event.key === "Backspace") {
    return "backspace";
  }

  return null;
}

function isUndoKey(event: BoardShortcutKeyEvent): boolean {
  // Exclude Shift (redo) and Alt (Ctrl+Alt is AltGr on Windows).
  if (event.shiftKey || event.altKey) {
    return false;
  }

  // Match `key` on Latin layouts (so QWERTZ/AZERTY follow a moved Z) and
  // physical `KeyZ` on non-Latin layouts (e.g. Hebrew).
  const isLatinLetter = /^[a-z]$/i.test(event.key);

  return isLatinLetter
    ? event.key.toLowerCase() === "z"
    : event.code === "KeyZ";
}
