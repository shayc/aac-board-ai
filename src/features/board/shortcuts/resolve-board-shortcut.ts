type BoardShortcutAction =
  | { kind: "backspace" }
  | { kind: "clear" }
  | { kind: "play" }
  | { kind: "stop" };

export interface BoardKeyEvent {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
}

/**
 * Resolves board-owned keyboard shortcuts to actions. Returns `null` for
 * unclaimed keys so native control activation and browser shortcuts can
 * continue.
 */
export function resolveBoardShortcut(
  event: BoardKeyEvent,
  isMessagePlaying: boolean,
): BoardShortcutAction | null {
  if (event.metaKey || event.ctrlKey) {
    if (event.key === "Enter") {
      return isMessagePlaying ? null : { kind: "play" };
    }

    if (event.key === "Backspace") {
      return { kind: "clear" };
    }

    return null;
  }

  if (event.key === "Escape") {
    return isMessagePlaying ? { kind: "stop" } : null;
  }

  if (event.key === "Backspace") {
    return { kind: "backspace" };
  }

  return null;
}
