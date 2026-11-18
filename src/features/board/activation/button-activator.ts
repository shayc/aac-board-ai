import type { BoardAction, BoardButton } from "@features/library";
import { assertNever } from "@shared/utils/assert-never";
import { createTilePart } from "../message/message-transforms";
import type { MessageEdit, PlayMessage } from "../message/message-types";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { UseBoardPlaybackReturn } from "../playback/use-board-playback";

interface ButtonActivatorOptions {
  message: Pick<UseMessageReturn, "apply" | "applyIfUnchanged" | "play">;
  playback: Pick<UseBoardPlaybackReturn, "playPart" | "stop"> & {
    /** Plays the message without counting it as played. */
    echoMessage: PlayMessage;
  };
  navigation: Pick<UseBoardNavigationReturn, "goToBoard" | "goHome">;
  /** The language the board's text is in, when known. */
  language: string | undefined;
  shouldPlayTiles: boolean;
}

type ButtonActivator = (button: BoardButton) => void;

export function createButtonActivator({
  message,
  playback,
  navigation,
  language,
  shouldPlayTiles,
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
      language,
    });

    message.apply([{ kind: "tile", part }]);
    // A silent tile interrupts playback just as a played one does, so selecting
    // a tile while the message speaks stops it whatever the setting.
    if (!shouldPlayTiles) {
      playback.stop();

      return;
    }

    void playback.playPart(part);
  }

  function runActions(actions: readonly BoardAction[]) {
    if (actions.some((action) => action.kind === "home")) {
      navigation.goHome();
    }

    const playIndex = actions.findLastIndex((action) => action.kind === "play");
    if (playIndex === -1) {
      message.apply(toMessageEdits(actions, language));

      return;
    }

    const editsBeforePlay = toMessageEdits(
      actions.slice(0, playIndex),
      language,
    );
    const { edited, hasChanged } = message.apply(editsBeforePlay);
    const editsAfterPlay = toMessageEdits(
      actions.slice(playIndex + 1),
      language,
    );

    // Only a tile that leaves the message as it stands plays it.
    if (!hasChanged) {
      void message.play(editsAfterPlay);

      return;
    }

    // A tile that spells and then plays echoes the word being typed, which is
    // feedback on the tile, so it stays silent when tiles are not played.
    if (!shouldPlayTiles) {
      playback.stop();
      message.apply(editsAfterPlay);

      return;
    }

    // Edits after an echo wait for it to complete and are dropped if the
    // message was edited meanwhile: a ":clear" must not take letters typed
    // during the playback with it.
    void playback.echoMessage(edited.parts).then((hasCompleted) => {
      if (hasCompleted) {
        message.applyIfUnchanged(edited, editsAfterPlay);
      }
    });
  }

  return activateButton;
}

function toMessageEdits(
  actions: readonly BoardAction[],
  language: string | undefined,
): MessageEdit[] {
  return actions.flatMap((action) => {
    switch (action.kind) {
      // Spelled letters are the board's text, so they are in its language.
      case "spell":
        return { ...action, language };
      case "space":
      case "backspace":
      case "clear":
        return action;
      case "home":
      case "play":
        return [];
      default:
        return assertNever(action);
    }
  });
}
