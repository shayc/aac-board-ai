import { assertNever } from "@shared/utils/assert-never";
import type { DOMAttributes } from "react";
import { useKeyboard } from "react-aria";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardPlaybackReturn } from "../playback/use-board-playback";
import { resolveBoardShortcut } from "./resolve-board-shortcut";

interface UseBoardShortcutsOptions {
  message: Pick<UseMessageReturn, "parts" | "backspace" | "clear">;
  playback: Pick<
    UseBoardPlaybackReturn,
    "playMessage" | "stop" | "isMessagePlaying"
  >;
}

interface UseBoardShortcutsReturn {
  rootProps: DOMAttributes<HTMLElement>;
}

export function useBoardShortcuts({
  message,
  playback,
}: UseBoardShortcutsOptions): UseBoardShortcutsReturn {
  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      const action = resolveBoardShortcut(
        { key: event.key, metaKey: event.metaKey, ctrlKey: event.ctrlKey },
        playback.isMessagePlaying,
      );

      if (!action) {
        event.continuePropagation();

        return;
      }

      event.preventDefault();

      switch (action.kind) {
        case "backspace":
          message.backspace();
          break;
        case "clear":
          message.clear();
          break;
        case "play":
          void playback.playMessage(message.parts);
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
