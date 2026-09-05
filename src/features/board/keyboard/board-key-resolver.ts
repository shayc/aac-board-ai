type BoardKeyAction =
  | { kind: "backspace" }
  | { kind: "clear" }
  | { kind: "playMessage" }
  | { kind: "stop" };

export interface KeyEventLike {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
}

/**
 * Resolves board-owned keyboard shortcuts to actions. Returns `null` for
 * unclaimed keys so native control activation and browser shortcuts can
 * continue.
 */
export function resolveBoardKey(
  event: KeyEventLike,
  isMessagePlaying: boolean,
): BoardKeyAction | null {
  if (event.metaKey || event.ctrlKey) {
    if (event.key === "Enter") {
      return isMessagePlaying ? null : { kind: "playMessage" };
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
