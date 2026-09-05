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
    let partsToPlay: MessagePart[] | null = null;

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
          partsToPlay = parts;
          break;

        default:
          assertNever(action);
      }
    }

    if (partsToPlay) {
      if (partsToPlay !== message.parts) {
        message.setParts(partsToPlay);
      }

      // Mutations after ":speak" (such as ":clear") wait for playback to
      // complete without interruption, keeping the message visible while it plays.
      const finalParts = parts;
      void playback.playMessage(partsToPlay).then((outcome) => {
        if (outcome === "completed" && finalParts !== partsToPlay) {
          message.setParts(finalParts);
        }
      });
    } else if (parts !== message.parts) {
      message.setParts(parts);
    }
  }

  return activateButton;
}
