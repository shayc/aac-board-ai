import type { BoardAction, BoardButton } from "@features/library";
import { assertNever } from "@shared/utils/assert-never";
import {
  appendTilePart,
  applyBackspace,
  closeWord,
  createTilePart,
  EMPTY_MESSAGE,
  hasSameContent,
  markSpoken,
  spell,
} from "../message/message-transforms";
import type { Message } from "../message/message-types";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { UseBoardPlaybackReturn } from "../playback/use-board-playback";

interface ButtonActivatorOptions {
  message: Pick<UseMessageReturn, "getState" | "setState">;
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
    const part = createTilePart({
      label: button.label,
      vocalization: button.vocalization,
      imageSrc: button.imageSrc,
      soundSrc: button.soundSrc,
    });

    message.setState(appendTilePart(message.getState(), part));
    void playback.playPart(part);
  }

  function runActions(actions: readonly BoardAction[]) {
    if (actions.some((action) => action.kind === "home")) {
      navigation.goHome();
    }

    const playIndex = actions.findLastIndex((action) => action.kind === "play");
    if (playIndex === -1) {
      commitEdits(message.getState(), actions.filter(isMessageEdit));

      return;
    }

    const messageBeforeEdits = message.getState();
    const editsBeforePlay = actions.slice(0, playIndex).filter(isMessageEdit);
    const messageToPlay = commitEdits(messageBeforeEdits, editsBeforePlay);
    const editsAfterPlay = actions.slice(playIndex + 1).filter(isMessageEdit);

    // A tile that spells and then plays echoes the word being typed, so only a
    // tile that plays the message as it stands speaks it.
    const play =
      messageToPlay === messageBeforeEdits
        ? playback.playMessage
        : playback.echoMessage;

    // Edits after ":speak" (such as ":clear") wait for playback to complete
    // without interruption, keeping the message visible while it plays. They
    // belong to the message just spoken, so they change it instead of starting
    // a new one, and they are dropped if it was edited while it played: a
    // ":clear" must not take letters typed during the speech with it.
    void play(messageToPlay.parts).then((hasCompleted) => {
      const current = message.getState();
      if (hasCompleted && hasSameContent(current, messageToPlay)) {
        commitEdits(markSpoken(current, false), editsAfterPlay);
      }
    });
  }

  function commitEdits(from: Message, edits: readonly MessageEdit[]): Message {
    const edited = edits.reduce(applyEdit, from);
    if (edited !== from) {
      message.setState(edited);
    }

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
      return spell(message, edit.text);
    case "space":
      return closeWord(message);
    case "backspace":
      return applyBackspace(message);
    case "clear":
      return EMPTY_MESSAGE;
    default:
      return assertNever(edit);
  }
}
