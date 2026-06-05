import type { DOMAttributes } from "react";
import { useKeyboard } from "react-aria";
import type { UseMessagePlaybackReturn } from "../message/playback/use-message-playback";
import type { UseMessageReturn } from "../message/use-message";
import { resolveBoardKey } from "./board-key-resolver";

export interface UseBoardKeyboardOptions {
  message: Pick<UseMessageReturn, "removeLastPart" | "clear">;
  playback: Pick<UseMessagePlaybackReturn, "play" | "stop" | "isPlaying">;
}

export interface UseBoardKeyboardReturn {
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
        case "play":
          void playback.play();
          break;
        case "stop":
          playback.stop();
          break;
        default: {
          const _exhaustiveCheck: never = action;
          throw new Error(
            `Unhandled board key action: ${JSON.stringify(_exhaustiveCheck)}`,
          );
        }
      }
    },
  });

  return { rootProps: keyboardProps };
}
