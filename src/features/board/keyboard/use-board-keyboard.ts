import { assertNever } from "@shared/utils/assert-never";
import type { DOMAttributes } from "react";
import { useKeyboard } from "react-aria";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardPlaybackReturn } from "../playback/use-board-playback";
import { resolveBoardKey } from "./board-key-resolver";

interface UseBoardKeyboardOptions {
  message: Pick<UseMessageReturn, "parts" | "removeLastPart" | "clear">;
  playback: Pick<UseBoardPlaybackReturn, "playMessage" | "stop" | "isPlaying">;
}

interface UseBoardKeyboardReturn {
  rootProps: DOMAttributes<HTMLElement>;
}

export function useBoardKeyboard({
  message,
  playback,
}: UseBoardKeyboardOptions): UseBoardKeyboardReturn {
  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      const action = resolveBoardKey(
        { key: event.key, metaKey: event.metaKey, ctrlKey: event.ctrlKey },
        playback.isPlaying,
      );

      if (!action) {
        event.continuePropagation();

        return;
      }

      event.preventDefault();
      switch (action.kind) {
        case "backspace":
          message.removeLastPart();
          break;
        case "clear":
          message.clear();
          break;
        case "speak":
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
