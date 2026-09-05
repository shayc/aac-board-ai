import { assertNever } from "@shared/utils/assert-never";
import type { DOMAttributes } from "react";
import { useKeyboard } from "react-aria";
import type { CommunicationSession } from "../session/communication-session";
import { resolveBoardKey } from "./board-key-resolver";

interface UseBoardKeyboardOptions {
  session: Pick<
    CommunicationSession,
    "backspace" | "clear" | "playMessage" | "stop"
  >;
  isMessagePlaying: boolean;
}

interface UseBoardKeyboardReturn {
  rootProps: DOMAttributes<HTMLElement>;
}

export function useBoardKeyboard({
  session,
  isMessagePlaying,
}: UseBoardKeyboardOptions): UseBoardKeyboardReturn {
  const { keyboardProps } = useKeyboard({
    onKeyDown: (event) => {
      const action = resolveBoardKey(
        { key: event.key, metaKey: event.metaKey, ctrlKey: event.ctrlKey },
        isMessagePlaying,
      );

      if (!action) {
        event.continuePropagation();

        return;
      }

      event.preventDefault();

      switch (action.kind) {
        case "backspace":
          session.backspace();
          break;
        case "clear":
          session.clear();
          break;
        case "playMessage":
          void session.playMessage();
          break;
        case "stop":
          session.stop();
          break;
        default:
          assertNever(action);
      }
    },
  });

  return { rootProps: keyboardProps };
}
