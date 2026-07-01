import { playAudio } from "@shared/audio/play-audio";
import { speak } from "@shared/speech/speech-store";
import { assertNever } from "@shared/utils/assert-never";
import {
  addPartToParts,
  addSpaceToParts,
  appendTextToParts,
  removeLastPartFromParts,
} from "../message/message-transforms";
import type { UseMessagePlaybackReturn } from "../message/playback/use-message-playback";
import type { MessagePart, UseMessageReturn } from "../message/use-message";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { BoardButton } from "../types";
import { resolveButtonIntent } from "./button-intent-resolver";

export interface ButtonActivationOptions {
  message: Pick<UseMessageReturn, "parts" | "setParts">;
  playback: Pick<UseMessagePlaybackReturn, "play">;
  navigation: Pick<UseBoardNavigationReturn, "goToBoard" | "goHome">;
}

export interface ButtonActivation {
  activateButton: (button: BoardButton) => void;
}

export function createButtonActivation({
  message,
  playback,
  navigation,
}: ButtonActivationOptions): ButtonActivation {
  function activateButton(button: BoardButton) {
    const intents = resolveButtonIntent(button);

    let parts = message.parts;
    let partsToSpeak: MessagePart[] | null = null;

    for (const intent of intents) {
      switch (intent.kind) {
        case "navigate":
          navigation.goToBoard(intent.targetBoardId);
          break;
        case "compose":
          parts = addPartToParts(parts, intent.content);
          break;
        case "playAudio":
          void playAudio(intent.src);
          break;
        case "speakText":
          void speak(intent.text);
          break;
        case "runAction":
          switch (intent.action.kind) {
            case "spell":
              parts = appendTextToParts(parts, intent.action.text);
              break;
            case "space":
              parts = addSpaceToParts(parts);
              break;
            case "backspace":
              parts = removeLastPartFromParts(parts);
              break;
            case "clear":
              parts = [];
              break;
            case "home":
              navigation.goHome();
              break;
            case "speak":
              partsToSpeak = parts;
              break;

            default:
              assertNever(intent.action);
          }
          break;

        default:
          assertNever(intent);
      }
    }

    if (partsToSpeak) {
      if (partsToSpeak !== message.parts) {
        message.setParts(partsToSpeak);
      }
      // Post-speak mutations (":speak" then ":clear") commit after the
      // utterance, so the spoken message stays visible while it plays.
      const partsAfterSpeak = parts;
      void playback.play(partsToSpeak).then(() => {
        if (partsAfterSpeak !== partsToSpeak) {
          message.setParts(partsAfterSpeak);
        }
      });
    } else if (parts !== message.parts) {
      message.setParts(parts);
    }
  }

  return { activateButton };
}
