import { playAudio } from "@shared/audio/play-audio";
import { speak } from "@shared/speech/speech-store";
import type { UseMessagePlaybackReturn } from "../message/playback/use-message-playback";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { BoardAction, BoardButton } from "../types";
import { resolveButtonIntent } from "./button-intent-resolver";

export interface ButtonActivationOptions {
  message: UseMessageReturn;
  playback: UseMessagePlaybackReturn;
  navigation: UseBoardNavigationReturn;
}

export interface ButtonActivation {
  activateButton: (button: BoardButton) => Promise<void>;
}

export function createButtonActivation({
  message,
  playback,
  navigation,
}: ButtonActivationOptions): ButtonActivation {
  async function activateButton(button: BoardButton) {
    const intents = resolveButtonIntent(button);

    for (const intent of intents) {
      switch (intent.kind) {
        case "navigate":
          navigation.goToBoard(intent.targetBoardId);
          break;
        case "compose":
          message.addPart(intent.content);
          break;
        case "playAudio":
          void playAudio(intent.src);
          break;
        case "speakText":
          void speak(intent.text);
          break;
        case "runAction":
          await runAction(intent.action);
          break;

        default: {
          const _exhaustiveCheck: never = intent;
          throw new Error(
            `Unhandled intent kind: ${JSON.stringify(_exhaustiveCheck)}`,
          );
        }
      }
    }
  }

  async function runAction(action: BoardAction) {
    switch (action.kind) {
      case "spell":
        return message.appendText(action.text);
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

      default: {
        const _exhaustiveCheck: never = action;
        throw new Error(
          `Unhandled action kind: ${JSON.stringify(_exhaustiveCheck)}`,
        );
      }
    }
  }

  return { activateButton };
}
