import { useAudio } from "@shared/hooks/use-audio";
import { speak } from "@shared/speech/speech-store";
import { resolveButtonIntent } from "./intent-resolver";
import type { UseMessageReturn } from "../message/use-message";
import type { UseMessagePlaybackReturn } from "../message/use-message-playback";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { BoardAction, BoardButton } from "../types";

export interface UseButtonActivationOptions {
  message: UseMessageReturn;
  playback: UseMessagePlaybackReturn;
  navigation: UseBoardNavigationReturn;
}

export interface UseButtonActivationReturn {
  activateButton: (button: BoardButton) => Promise<void>;
}

export function useButtonActivation({
  message,
  playback,
  navigation,
}: UseButtonActivationOptions): UseButtonActivationReturn {
  const audio = useAudio();

  async function activateButton(button: BoardButton) {
    const intents = resolveButtonIntent(button);

    for (const intent of intents) {
      switch (intent.kind) {
        case "navigate":
          navigation.goToBoard(intent.targetBoardId);
          break;
        case "compose":
          message.addPart(intent.part);
          break;
        case "playAudio":
          void audio.play(intent.src);
          break;
        case "speakText":
          void speak(intent.text);
          break;
        case "runAction":
          await runAction(intent.action);
          break;
      }
    }
  }

  async function runAction(action: BoardAction) {
    switch (action.kind) {
      case "space":
        return message.addSpace();
      case "backspace":
        return message.removeLastPart();
      case "clear":
        return message.clear();
      case "home":
        return navigation.goHome();
      case "speak":
        return playback.play();
      case "spell":
        return appendToLastPart(action.text);
    }
  }

  function appendToLastPart(text: string) {
    const lastPart = message.parts.at(-1);
    message.updateLastPart({
      id: text,
      label: `${lastPart?.label ?? ""}${text}`,
    });
  }

  return { activateButton };
}
