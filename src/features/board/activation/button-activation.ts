import { playAudio } from "@shared/audio/play-audio";
import { speak } from "@shared/speech/speak";
import { assertNever } from "@shared/utils/assert-never";
import {
  appendPart,
  appendSpace,
  appendTextToLastPart,
  dropLastPart,
} from "../message/message-transforms";
import type { MessagePart } from "../message/message-types";
import type { BoardButton } from "../types";
import { resolveButtonIntents } from "./button-intent-resolver";

interface ActivationMessage {
  parts: MessagePart[];
  setParts: (parts: MessagePart[]) => void;
}

interface ActivationPlayback {
  play: (parts: MessagePart[]) => Promise<void>;
}

interface ActivationNavigation {
  goToBoard: (targetBoardId: string) => void;
  goHome: () => void;
}

interface ButtonActivationOptions {
  message: ActivationMessage;
  playback: ActivationPlayback;
  navigation: ActivationNavigation;
}

interface ButtonActivation {
  activateButton: (button: BoardButton) => void;
}

export function createButtonActivation({
  message,
  playback,
  navigation,
}: ButtonActivationOptions): ButtonActivation {
  function activateButton(button: BoardButton) {
    const intents = resolveButtonIntents(button);

    let parts = message.parts;
    let partsToSpeak: MessagePart[] | null = null;

    for (const intent of intents) {
      switch (intent.kind) {
        case "navigate":
          navigation.goToBoard(intent.targetBoardId);
          break;
        case "compose":
          parts = appendPart(parts, intent.content);
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
              parts = appendTextToLastPart(parts, intent.action.text);
              break;
            case "space":
              parts = appendSpace(parts);
              break;
            case "backspace":
              parts = dropLastPart(parts);
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
