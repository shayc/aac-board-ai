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
    "playMessage" | "echoMessage" | "playPart"
  >;
  navigation: Pick<UseBoardNavigationReturn, "goToBoard" | "goHome">;
  /** The language the board's text is in, when known. */
  language: string | undefined;
}

type ButtonActivator = (button: BoardButton) => void;

export function createButtonActivator({
  message,
  playback,
  navigation,
  language,
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

    // A tile that spells and then plays echoes the word being typed, so only a
    // tile that plays the message as it stands speaks it.
    const play = hasChanged ? playback.echoMessage : playback.playMessage;

    // Edits after ":speak" (such as ":clear") wait for playback to complete
    // without interruption, keeping the message visible while it plays, and
    // are dropped if the message was edited meanwhile: a ":clear" must not
    // take letters typed during the speech with it.
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
