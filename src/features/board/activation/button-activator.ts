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
  isShiftOn: boolean;
  onShiftChange: (isShiftOn: boolean) => void;
}

type ButtonActivator = (button: BoardButton) => void;

export function createButtonActivator({
  message,
  playback,
  navigation,
  language,
  shouldPlayTiles,
  isShiftOn,
  onShiftChange,
}: ButtonActivatorOptions): ButtonActivator {
  function activateButton(button: BoardButton) {
    const shifted = applyShift(button.actions, isShiftOn, language);
    onShiftChange(shifted.isShiftOn);

    if (button.linkedBoardId) {
      navigation.goToBoard(button.linkedBoardId);

      return;
    }

    if (button.actions.length === 0) {
      composeAndPlayButton(button);

      return;
    }

    runActions(shifted.actions);
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
    const { edited: messageToPlay, hasChanged } =
      message.apply(editsBeforePlay);
    const editsAfterPlay = toMessageEdits(
      actions.slice(playIndex + 1),
      language,
    );

    // A tile that spells and then plays echoes the word being typed, so only a
    // tile that plays the message as it stands speaks it. The echo is feedback
    // on the tile, so it stays silent when tiles are not played.
    const isEcho = hasChanged;
    if (isEcho && !shouldPlayTiles) {
      playback.stop();
      message.apply(editsAfterPlay);

      return;
    }

    const play = isEcho ? playback.echoMessage : playback.playMessage;

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

interface ShiftedActions {
  actions: BoardAction[];
  isShiftOn: boolean;
}

// Shift capitalizes the next spelled text and then lets go, as on a phone
// keyboard. A tile without a shift action lets go of it too, so a capital
// never waits for a letter spelled much later.
function applyShift(
  actions: readonly BoardAction[],
  isShiftOn: boolean,
  language: string | undefined,
): ShiftedActions {
  let isOn = isShiftOn;
  const shiftedActions: BoardAction[] = [];

  for (const action of actions) {
    if (action.kind === "shift") {
      isOn = !isOn;
      continue;
    }

    if (action.kind === "spell" && isOn && action.text) {
      isOn = false;
      shiftedActions.push({
        ...action,
        text: capitalize(action.text, language),
      });
      continue;
    }

    shiftedActions.push(action);
  }

  const hasShiftAction = actions.some((action) => action.kind === "shift");

  return { actions: shiftedActions, isShiftOn: hasShiftAction && isOn };
}

function capitalize(text: string, language: string | undefined): string {
  const [firstLetter = ""] = text;

  return `${toUpperCase(firstLetter, language)}${text.slice(firstLetter.length)}`;
}

function toUpperCase(text: string, language: string | undefined): string {
  try {
    return text.toLocaleUpperCase(language);
  } catch {
    // A board can declare a locale the browser rejects.
    return text.toUpperCase();
  }
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
      case "shift":
      case "unsupported":
        return [];
      default:
        return assertNever(action);
    }
  });
}
