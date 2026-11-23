import type { BoardAction, BoardButton } from "@features/library";
import { assertNever } from "@shared/utils/assert-never";
import { createTilePart, type MessageEdit } from "../message/message";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { UseBoardPlaybackReturn } from "../playback/use-board-playback";

interface TileActivatorOptions {
  message: Pick<UseMessageReturn, "apply" | "play" | "echo">;
  playback: Pick<UseBoardPlaybackReturn, "playTile" | "stop">;
  navigation: Pick<UseBoardNavigationReturn, "goToBoard" | "goHome">;
  boardLanguage: string | undefined;
  shouldPlayTiles: boolean;
}

type TileActivator = (button: BoardButton) => void;

export function createTileActivator({
  message,
  playback,
  navigation,
  boardLanguage,
  shouldPlayTiles,
}: TileActivatorOptions): TileActivator {
  function activateTile(button: BoardButton) {
    if (button.linkedBoardId) {
      navigation.goToBoard(button.linkedBoardId);

      return;
    }

    if (button.actions.length === 0) {
      addAndPlayTile(button);

      return;
    }

    runActions(button.actions);
  }

  function addAndPlayTile(button: BoardButton) {
    const part = createTilePart({
      label: button.label,
      vocalization: button.vocalization,
      imageSrc: button.imageSrc,
      soundSrc: button.soundSrc,
      language: boardLanguage,
    });

    message.apply([{ kind: "tile", part }]);
    if (!shouldPlayTiles) {
      playback.stop();

      return;
    }

    void playback.playTile(part);
  }

  function runActions(actions: readonly BoardAction[]) {
    if (actions.some((action) => action.kind === "home")) {
      navigation.goHome();
    }

    const playIndex = actions.findLastIndex((action) => action.kind === "play");
    if (playIndex === -1) {
      message.apply(toMessageEdits(actions, boardLanguage));

      return;
    }

    const editsBeforePlay = toMessageEdits(
      actions.slice(0, playIndex),
      boardLanguage,
    );
    const editsAfterPlay = toMessageEdits(
      actions.slice(playIndex + 1),
      boardLanguage,
    );

    const hasChanged = message.apply(editsBeforePlay);
    if (!hasChanged) {
      void message.play(editsAfterPlay);

      return;
    }

    if (!shouldPlayTiles) {
      playback.stop();
      message.apply(editsAfterPlay);

      return;
    }

    void message.echo(editsAfterPlay);
  }

  return activateTile;
}

function toMessageEdits(
  actions: readonly BoardAction[],
  boardLanguage: string | undefined,
): MessageEdit[] {
  return actions.flatMap((action) => {
    switch (action.kind) {
      case "spell":
        return { ...action, language: boardLanguage };
      case "space":
      case "backspace":
      case "clear":
        return action;
      case "home":
      case "play":
      case "unsupported":
        return [];
      default:
        return assertNever(action);
    }
  });
}
