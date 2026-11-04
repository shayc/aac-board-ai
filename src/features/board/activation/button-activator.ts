import type { PlaybackOutcome } from "@shared/playback/playback-types";
import { assertNever } from "@shared/utils/assert-never";
import {
  applyBackspace,
  appendSpace,
  appendText,
  createPart,
} from "../message/message-transforms";
import type { MessagePart } from "../message/message-types";
import type { BoardButton } from "../board-types";

interface ActivationMessage {
  getParts: () => MessagePart[];
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
    if (button.linkedBoardId) {
      navigation.goToBoard(button.linkedBoardId);
      return;
    }

    const currentParts = message.getParts();

    if (button.actions.length === 0) {
      const part = createPart({
        label: button.label,
        vocalization: button.vocalization,
        imageSrc: button.imageSrc,
        soundSrc: button.soundSrc,
      });

      message.setParts([...currentParts, part]);
      void playback.playPart(part);
      return;
    }

    let parts = currentParts;
    let partsToPlay: MessagePart[] | null = null;

    for (const action of button.actions) {
      switch (action.kind) {
        case "spell":
          parts = appendText(parts, action.text);
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

    if (partsToPlay === null) {
      if (parts !== currentParts) {
        message.setParts(parts);
      }

      return;
    }

    if (partsToPlay !== currentParts) {
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
  }

  return activateButton;
}
