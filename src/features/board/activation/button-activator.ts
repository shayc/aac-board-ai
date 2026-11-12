import { assertNever } from "@shared/utils/assert-never";
import {
  appendSpace,
  appendText,
  applyBackspace,
  createPart,
} from "../message/message-transforms";
import type { MessagePart } from "../message/message-types";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { UseBoardPlaybackReturn } from "../playback/use-board-playback";
import type { BoardAction, BoardButton } from "../board-types";

interface ButtonActivatorOptions {
  message: Pick<UseMessageReturn, "getParts" | "setParts">;
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

    message.setParts([...message.getParts(), part]);
    void playback.playPart(part);
  }

  function runActions(actions: readonly BoardAction[]) {
    if (actions.some((action) => action.kind === "home")) {
      navigation.goHome();
    }

    const playIndex = actions.findLastIndex((action) => action.kind === "play");
    if (playIndex === -1) {
      commitEdits(message.getParts(), actions);
      return;
    }

    const partsToPlay = commitEdits(
      message.getParts(),
      actions.slice(0, playIndex),
    );
    const actionsAfterPlay = actions.slice(playIndex + 1);

    // Edits after ":speak" (such as ":clear") wait for playback to complete
    // without interruption, keeping the message visible while it plays.
    void playback.playMessage(partsToPlay).then((hasCompleted) => {
      if (hasCompleted) {
        commitEdits(message.getParts(), actionsAfterPlay);
      }
    });
  }

  function commitEdits(
    parts: readonly MessagePart[],
    actions: readonly BoardAction[],
  ) {
    const edits = actions.filter(isMessageEdit);
    if (edits.length === 0) {
      return parts;
    }

    const editedParts = edits.reduce(applyEdit, parts);
    message.setParts(editedParts);

    return editedParts;
  }

  return activateButton;
}

type MessageEdit = Exclude<BoardAction, { kind: "home" | "play" }>;

function isMessageEdit(action: BoardAction): action is MessageEdit {
  return action.kind !== "home" && action.kind !== "play";
}

function applyEdit(
  parts: readonly MessagePart[],
  edit: MessageEdit,
): readonly MessagePart[] {
  switch (edit.kind) {
    case "spell":
      return appendText(parts, edit.text);
    case "space":
      return appendSpace(parts);
    case "backspace":
      return applyBackspace(parts);
    case "clear":
      return [];
    default:
      return assertNever(edit);
  }
}
