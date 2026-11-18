import type { BoardAction, BoardButton } from "@features/library";
import { assertNever } from "@shared/utils/assert-never";
import { createTilePart } from "../message/message-transforms";
import type { MessageEdit } from "../message/message-types";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { UseBoardPlaybackReturn } from "../playback/use-board-playback";

interface ButtonActivatorOptions {
  message: Pick<UseMessageReturn, "apply" | "play" | "echo">;
  playback: Pick<UseBoardPlaybackReturn, "playPart" | "stop">;
  navigation: Pick<UseBoardNavigationReturn, "goToBoard" | "goHome">;
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
    // A silent tile still interrupts a message that is playing.
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
    const hasChanged = message.apply(editsBeforePlay);
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

    void message.echo(editsAfterPlay);
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
