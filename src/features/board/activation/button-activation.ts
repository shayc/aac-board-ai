import type { PlaybackOutcome } from "@shared/playback/playback-context";
import { assertNever } from "@shared/utils/assert-never";
import {
  applyBackspace,
  appendSpace,
  appendTextToLastPart,
  createPart,
} from "../message/message-transforms";
import type { MessagePart } from "../message/message-types";
import type { BoardButton } from "../types";
import { resolveButtonIntents } from "./button-intent-resolver";

interface ActivationMessage {
  parts: MessagePart[];
  setParts: (parts: MessagePart[]) => void;
}

interface ActivationPlayback {
  playMessage: (parts: MessagePart[]) => Promise<PlaybackOutcome>;
  playPart: (part: MessagePart) => Promise<PlaybackOutcome>;
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
    let partToPlay: MessagePart | null = null;

    for (const intent of intents) {
      switch (intent.kind) {
        case "navigate":
          navigation.goToBoard(intent.targetBoardId);
          break;
        case "composeAndPlay":
          partToPlay = createPart(intent.content);
          parts = [...parts, partToPlay];
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
              parts = applyBackspace(parts);
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
      void playback.playMessage(partsToSpeak).then((outcome) => {
        if (outcome === "completed" && partsAfterSpeak !== partsToSpeak) {
          message.setParts(partsAfterSpeak);
        }
      });
    } else if (parts !== message.parts) {
      message.setParts(parts);
    }

    if (partToPlay) {
      void playback.playPart(partToPlay);
    }
  }

  return { activateButton };
}
