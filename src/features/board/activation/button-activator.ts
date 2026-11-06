import type { PlaybackOutcome } from "@shared/playback/playback-types";
import { assertNever } from "@shared/utils/assert-never";
import {
  appendSpace,
  appendText,
  applyBackspace,
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

    const startingParts = message.getParts();

    if (button.actions.length === 0) {
      const part = createPart({
        label: button.label,
        vocalization: button.vocalization,
        imageSrc: button.imageSrc,
        soundSrc: button.soundSrc,
      });

      message.setParts([...startingParts, part]);
      void playback.playPart(part);
      return;
    }

    let editedParts = startingParts;
    let partsToPlay: MessagePart[] | null = null;

    for (const action of button.actions) {
      switch (action.kind) {
        case "spell":
          editedParts = appendText(editedParts, action.text);
          break;
        case "space":
          editedParts = appendSpace(editedParts);
          break;
        case "backspace":
          editedParts = applyBackspace(editedParts);
          break;
        case "clear":
          editedParts = [];
          break;
        case "home":
          navigation.goHome();
          break;
        case "speak":
          partsToPlay = editedParts;
          break;

        default:
          assertNever(action);
      }
    }

    if (partsToPlay === null) {
      if (editedParts !== startingParts) {
        message.setParts(editedParts);
      }

      return;
    }

    if (partsToPlay !== startingParts) {
      message.setParts(partsToPlay);
    }

    // Edits after ":speak" (such as ":clear") wait for playback to complete
    // without interruption, keeping the message visible while it plays.
    void playback.playMessage(partsToPlay).then((outcome) => {
      if (outcome === "completed" && editedParts !== partsToPlay) {
        message.setParts(editedParts);
      }
    });
  }

  return activateButton;
}
