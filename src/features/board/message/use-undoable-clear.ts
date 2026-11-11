import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import type { UseMessageReturn } from "./use-message";

// Longer than an informational snackbar: someone who holds a press longer
// than intended also needs longer to notice the message is gone and react.
const UNDO_DURATION_MS = 10_000;

/**
 * Clears the message and offers to bring it back. A long press on Backspace
 * wipes the whole message, which is easy to do by accident when presses are
 * slow or held.
 */
export function useUndoableClear(
  message: Pick<UseMessageReturn, "getParts" | "setParts" | "clear">,
): () => void {
  const { showSnackbar } = useSnackbar();

  return function clearWithUndo() {
    const clearedParts = message.getParts();
    if (clearedParts.length === 0) {
      return;
    }

    message.clear();

    showSnackbar({
      message: (t) => t(m.messageCleared),
      durationMs: UNDO_DURATION_MS,
      action: {
        label: (t) => t(m.messageClearUndo),
        // Keeps anything composed since the clear, after the restored parts.
        onSelect: () =>
          message.setParts([...clearedParts, ...message.getParts()]),
      },
    });
  };
}
