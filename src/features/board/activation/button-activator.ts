import type { BoardAction, BoardButton } from "@features/library";
import { assertNever } from "@shared/utils/assert-never";
import {
  appendPart,
  appendText,
  applyBackspace,
  createPart,
  EMPTY_MESSAGE,
  finishSpelling,
  messageParts,
} from "../message/message-transforms";
import type { Message } from "../message/message-types";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { UseBoardPlaybackReturn } from "../playback/use-board-playback";

interface ButtonActivatorOptions {
  message: Pick<UseMessageReturn, "getCurrent" | "setCurrent">;
  playback: Pick<UseBoardPlaybackReturn, "playMessage" | "playPart">;
  navigation: Pick<UseBoardNavigationReturn, "goToBoard" | "goHome">;
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

    if (button.actions.length === 0) {
      composeAndPlayButton(button);

      return;
    }

    runActions(button.actions);
  }

  function composeAndPlayButton(button: BoardButton) {
    const part = createPart({
      label: button.label,
      vocalization: button.vocalization,
      imageSrc: button.imageSrc,
      soundSrc: button.soundSrc,
    });

    message.setCurrent(appendPart(message.getCurrent(), part));
    void playback.playPart(part);
  }

  function runActions(actions: readonly BoardAction[]) {
    if (actions.some((action) => action.kind === "home")) {
      navigation.goHome();
    }

    const playIndex = actions.findLastIndex((action) => action.kind === "play");
    if (playIndex === -1) {
      commitEdits(actions);

      return;
    }

    const messageToPlay = commitEdits(actions.slice(0, playIndex));
    const actionsAfterPlay = actions.slice(playIndex + 1);

    // Edits after ":speak" (such as ":clear") wait for playback to complete
    // without interruption, keeping the message visible while it plays.
    void playback
      .playMessage(messageParts(messageToPlay))
      .then((hasCompleted) => {
        if (hasCompleted) {
          commitEdits(actionsAfterPlay);
        }
      });
  }

  function commitEdits(actions: readonly BoardAction[]) {
    const current = message.getCurrent();
    const edits = actions.filter(isMessageEdit);
    if (edits.length === 0) {
      return current;
    }

    const edited = edits.reduce(applyEdit, current);
    message.setCurrent(edited);

    return edited;
  }

  return activateButton;
}

type MessageEdit = Exclude<BoardAction, { kind: "home" | "play" }>;

function isMessageEdit(action: BoardAction): action is MessageEdit {
  return action.kind !== "home" && action.kind !== "play";
}

function applyEdit(message: Message, edit: MessageEdit): Message {
  switch (edit.kind) {
    case "spell":
      return appendText(message, edit.text);
    case "space":
      return finishSpelling(message);
    case "backspace":
      return applyBackspace(message);
    case "clear":
      return EMPTY_MESSAGE;
    default:
      return assertNever(edit);
  }
}
