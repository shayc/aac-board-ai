import type { BoardButton } from "./types";

export function getSpokenText(
  button: Pick<BoardButton, "vocalization" | "label">,
): string | undefined {
  return (button.vocalization ?? button.label)?.toLowerCase();
}

export function getNavigationTargetId(
  button: Pick<BoardButton, "loadBoard">,
): string | undefined {
  return button.loadBoard?.id;
}
