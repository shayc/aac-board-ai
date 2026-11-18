import { assertNever } from "@shared/utils/assert-never";
import type { DOMAttributes } from "react";
import { useKeyboard } from "react-aria";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardPlaybackReturn } from "../playback/use-board-playback";
import { resolveBoardShortcut } from "./resolve-board-shortcut";

interface UseBoardShortcutsOptions {
  message: Pick<UseMessageReturn, "backspace" | "clear" | "undo">;
  playback: Pick<UseBoardPlaybackReturn, "stop" | "isMessagePlaying">;
  speakMessage: () => Promise<void>;
}

interface UseBoardShortcutsReturn {
  rootProps: DOMAttributes<HTMLElement>;
}

export function useBoardShortcuts({
  message,
  playback,
  speakMessage,
}: UseBoardShortcutsOptions): UseBoardShortcutsReturn {
  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      const action = resolveBoardShortcut(event, playback.isMessagePlaying);
      if (!action) {
        event.continuePropagation();

        return;
      }

      event.preventDefault();

      switch (action) {
        case "backspace":
          message.backspace();
          break;
        case "clear":
          message.clear();
          break;
        case "undo":
          message.undo();
          break;
        case "play":
          void speakMessage();
          break;
        case "stop":
          playback.stop();
          break;
        default:
          assertNever(action);
      }
    },
  });

  return { rootProps: keyboardProps };
}
