import type { BoardAction, BoardButton } from "@features/library";
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

interface ButtonActivatorOptions {
  message: Pick<
    UseMessageReturn,
    "getParts" | "isAwaitingNewMessage" | "getPartsToAddTo" | "setParts"
  >;
  playback: Pick<
    UseBoardPlaybackReturn,
    "playMessage" | "echoMessage" | "playPart"
  >;
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

    message.setParts([...message.getPartsToAddTo(), part]);
    void playback.playPart(part);
  }

  function runActions(actions: readonly BoardAction[]) {
    if (actions.some((action) => action.kind === "home")) {
      navigation.goHome();
    }

    const playIndex = actions.findLastIndex((action) => action.kind === "play");
    if (playIndex === -1) {
      commitEdits(message.getParts(), getEditsToApply(actions));

      return;
    }

    const editsBeforePlay = getEditsToApply(actions.slice(0, playIndex));
    const partsToPlay = commitEdits(message.getParts(), editsBeforePlay);
    const editsAfterPlay = actions.slice(playIndex + 1).filter(isMessageEdit);

    // A tile that spells and then plays echoes the word being typed, so only a
    // tile that plays the message as it stands speaks it.
    const play =
      editsBeforePlay.length === 0
        ? playback.playMessage
        : playback.echoMessage;

    // Edits after ":speak" (such as ":clear") wait for playback to complete
    // without interruption, keeping the message visible while it plays.
    void play(partsToPlay).then((hasCompleted) => {
      if (hasCompleted) {
        commitEdits(message.getParts(), editsAfterPlay);
      }
    });
  }

  // A spoken message has no word for a space to end, so spaces before the next
  // letter are skipped. That letter starts a new message, as a tile does, while
  // backspace changes the spoken one.
  function getEditsToApply(
    actions: readonly BoardAction[],
  ): readonly MessageEdit[] {
    const edits = actions.filter(isMessageEdit);
    if (!message.isAwaitingNewMessage()) {
      return edits;
    }

    const firstWordEditIndex = edits.findIndex((edit) => edit.kind !== "space");
    if (firstWordEditIndex === -1) {
      return [];
    }

    const wordEdits = edits.slice(firstWordEditIndex);

    return wordEdits[0]?.kind === "spell"
      ? [{ kind: "clear" }, ...wordEdits]
      : wordEdits;
  }

  function commitEdits(
    parts: readonly MessagePart[],
    edits: readonly MessageEdit[],
  ) {
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
