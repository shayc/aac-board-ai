import type { BoardAction, BoardButton } from "@features/library";
import { createTilePart } from "../message/message-transforms";
import type { MessageEdit } from "../message/message-types";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { UseBoardPlaybackReturn } from "../playback/use-board-playback";

// Typed so that a new board action, or one listed as an edit the message
// cannot apply, fails to compile instead of failing when a tile is pressed.
const IS_MESSAGE_EDIT: {
  [Kind in BoardAction["kind"]]: Extract<
    BoardAction,
    { kind: Kind }
  > extends MessageEdit
    ? true
    : false;
} = {
  spell: true,
  space: true,
  backspace: true,
  clear: true,
  home: false,
  play: false,
};

interface ButtonActivatorOptions {
  message: Pick<UseMessageReturn, "edit" | "editIfUnchanged">;
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

    message.edit([{ kind: "tile", part }]);
    void playback.playPart(part);
  }

  function runActions(actions: readonly BoardAction[]) {
    if (actions.some((action) => action.kind === "home")) {
      navigation.goHome();
    }

    const playIndex = actions.findLastIndex((action) => action.kind === "play");
    if (playIndex === -1) {
      message.edit(actions.filter(isMessageEdit));

      return;
    }

    const editsBeforePlay = actions.slice(0, playIndex).filter(isMessageEdit);
    const { edited: messageToPlay, hasChanged } = message.edit(editsBeforePlay);
    const editsAfterPlay = actions.slice(playIndex + 1).filter(isMessageEdit);

    // A tile that spells and then plays echoes the word being typed, so only a
    // tile that plays the message as it stands speaks it.
    const play = hasChanged ? playback.echoMessage : playback.playMessage;

    // Edits after ":speak" (such as ":clear") wait for playback to complete
    // without interruption, keeping the message visible while it plays, and
    // are dropped if the message was edited meanwhile: a ":clear" must not
    // take letters typed during the speech with it.
    void play(messageToPlay.parts).then((hasCompleted) => {
      if (hasCompleted) {
        message.editIfUnchanged(messageToPlay, editsAfterPlay);
      }
    });
  }

  return activateButton;
}

function isMessageEdit(
  action: BoardAction,
): action is Extract<BoardAction, MessageEdit> {
  return IS_MESSAGE_EDIT[action.kind];
}
