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

interface ButtonActivatorOptions {
  message: ActivationMessage;
  playback: ActivationPlayback;
  navigation: ActivationNavigation;
}

type ButtonActivator = (button: BoardButton) => void;

export function createButtonActivator({
  message,
  playback,
  navigation,
}: ButtonActivatorOptions): ButtonActivator {
  function activateButton(button: BoardButton) {
    const targetBoardId = button.loadBoard?.id;
    if (targetBoardId) {
      navigation.goToBoard(targetBoardId);
      return;
    }

    if (!button.actions?.length) {
      const part = createPart({
        label: button.label,
        vocalization: button.vocalization,
        imageSrc: button.imageSrc,
        soundSrc: button.soundSrc,
      });

      message.setParts([...message.parts, part]);
      void playback.playPart(part);
      return;
    }

    let parts = message.parts;
    let partsToSpeak: MessagePart[] | null = null;

    for (const action of button.actions) {
      switch (action.kind) {
        case "spell":
          parts = appendTextToLastPart(parts, action.text);
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
          assertNever(action);
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
  }

  return activateButton;
}
