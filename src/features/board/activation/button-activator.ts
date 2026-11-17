import type { BoardAction, BoardButton } from "@features/library";
import { assertNever } from "@shared/utils/assert-never";
import { createTilePart } from "../message/message-transforms";
import type { MessageEdit } from "../message/message-types";
import type { UseMessageReturn } from "../message/use-message";
import type { UseBoardNavigationReturn } from "../navigation/use-board-navigation";
import type { UseBoardPlaybackReturn } from "../playback/use-board-playback";

interface ButtonActivatorOptions {
  message: Pick<UseMessageReturn, "apply" | "applyIfUnchanged">;
  playback: Pick<
    UseBoardPlaybackReturn,
    "playMessage" | "echoMessage" | "playPart" | "stop"
  >;
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
    // Selecting a silent tile still interrupts active message playback.
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
    const { edited: messageToPlay, hasChanged } =
      message.apply(editsBeforePlay);
    const editsAfterPlay = toMessageEdits(
      actions.slice(playIndex + 1),
      language,
    );

    // Edits before ":speak" mean the tile is echoing typed text, not speaking a
    // finished message: treat as tile feedback and don't mark the message played.
    const isEcho = hasChanged;
    if (isEcho && !shouldPlayTiles) {
      playback.stop();
      message.apply(editsAfterPlay);

      return;
    }

    const play = isEcho ? playback.echoMessage : playback.playMessage;

    // Defer post-play edits (e.g. ":clear") so the message stays visible while
    // speaking and mid-speech edits aren't wiped.
    void play(messageToPlay.parts).then((hasCompleted) => {
      if (hasCompleted) {
        message.applyIfUnchanged(messageToPlay, editsAfterPlay);
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
