import type { BoardAction, BoardButton } from "@features/library";
import { assertNever } from "@shared/utils/assert-never";
import {
  appendPart,
  applyBackspace,
  createTilePart,
  EMPTY_MESSAGE,
  finishWord,
  spellText,
} from "../message/message-transforms";
import type { MessageState } from "../message/message-types";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { UseBoardPlaybackReturn } from "../playback/use-board-playback";

interface ButtonActivatorOptions {
  message: Pick<UseMessageReturn, "getState" | "setState">;
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
    const part = createTilePart({
      label: button.label,
      vocalization: button.vocalization,
      imageSrc: button.imageSrc,
      soundSrc: button.soundSrc,
    });

    message.setState(appendPart(message.getState(), part));
    void playback.playPart(part);
  }

  function runActions(actions: readonly BoardAction[]) {
    if (actions.some((action) => action.kind === "home")) {
      navigation.goHome();
    }

    const playIndex = actions.findLastIndex((action) => action.kind === "play");
    if (playIndex === -1) {
      commitEdits(message.getState(), actions);

      return;
    }

    const messageToPlay = commitEdits(
      message.getState(),
      actions.slice(0, playIndex),
    );
    const actionsAfterPlay = actions.slice(playIndex + 1);

    // Edits after ":speak" (such as ":clear") wait for playback to complete
    // without interruption, keeping the message visible while it plays.
    void playback.playMessage(messageToPlay.parts).then((hasCompleted) => {
      if (hasCompleted) {
        commitEdits(message.getState(), actionsAfterPlay);
      }
    });
  }

  function commitEdits(state: MessageState, actions: readonly BoardAction[]) {
    const edits = actions.filter(isMessageEdit);
    if (edits.length === 0) {
      return state;
    }

    const editedState = edits.reduce(applyEdit, state);
    message.setState(editedState);

    return editedState;
  }

  return activateButton;
}

type MessageEdit = Exclude<BoardAction, { kind: "home" | "play" }>;

function isMessageEdit(action: BoardAction): action is MessageEdit {
  return action.kind !== "home" && action.kind !== "play";
}

function applyEdit(state: MessageState, edit: MessageEdit): MessageState {
  switch (edit.kind) {
    case "spell":
      return spellText(state, edit.text);
    case "space":
      return finishWord(state);
    case "backspace":
      return applyBackspace(state);
    case "clear":
      return EMPTY_MESSAGE;
    default:
      return assertNever(edit);
  }
}
