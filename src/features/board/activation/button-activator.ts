import type { PlaybackOutcome } from "@shared/playback/playback-types";
import { assertNever } from "@shared/utils/assert-never";
import {
  appendSpace,
  appendText,
  applyBackspace,
  createPart,
} from "../message/message-transforms";
import type { MessagePart } from "../message/message-types";
import type { BoardAction, BoardButton } from "../board-types";

interface ButtonActivatorOptions {
  language: string;
  getParts: () => MessagePart[];
  setParts: (parts: MessagePart[]) => void;
  playMessage: (parts: MessagePart[]) => Promise<PlaybackOutcome>;
  playPart: (part: MessagePart) => Promise<PlaybackOutcome>;
  goToBoard: (targetBoardId: string) => void;
  goHome: () => void;
}

type ButtonActivator = (button: BoardButton) => void;

export function createButtonActivator({
  language,
  getParts,
  setParts,
  playMessage,
  playPart,
  goToBoard,
  goHome,
}: ButtonActivatorOptions): ButtonActivator {
  function activateButton(button: BoardButton) {
    if (button.linkedBoardId) {
      goToBoard(button.linkedBoardId);
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
      language,
      imageSrc: button.imageSrc,
      soundSrc: button.soundSrc,
    });

    setParts([...getParts(), part]);
    void playPart(part);
  }

  function runActions(actions: BoardAction[]) {
    if (actions.some((action) => action.kind === "home")) {
      goHome();
    }

    const playIndex = actions.findLastIndex((action) => action.kind === "play");
    if (playIndex === -1) {
      commitEdits(getParts(), actions);
      return;
    }

    const partsToPlay = commitEdits(getParts(), actions.slice(0, playIndex));
    const actionsAfterPlay = actions.slice(playIndex + 1);

    // Edits after ":speak" (such as ":clear") wait for playback to complete
    // without interruption, keeping the message visible while it plays.
    void playMessage(partsToPlay).then((outcome) => {
      if (outcome === "completed") {
        commitEdits(getParts(), actionsAfterPlay);
      }
    });
  }

  function commitEdits(parts: MessagePart[], actions: BoardAction[]) {
    const edits = actions.filter(isMessageEdit);
    if (edits.length === 0) {
      return parts;
    }

    const editedParts = edits.reduce(
      (edited, edit) => applyEdit(edited, edit, language),
      parts,
    );
    setParts(editedParts);

    return editedParts;
  }

  return activateButton;
}

type MessageEdit = Exclude<BoardAction, { kind: "home" | "play" }>;

function isMessageEdit(action: BoardAction): action is MessageEdit {
  return action.kind !== "home" && action.kind !== "play";
}

function applyEdit(
  parts: MessagePart[],
  edit: MessageEdit,
  language: string,
): MessagePart[] {
  switch (edit.kind) {
    case "spell":
      return appendText(parts, edit.text, language);
    case "space":
      return appendSpace(parts, language);
    case "backspace":
      return applyBackspace(parts);
    case "clear":
      return [];
    default:
      return assertNever(edit);
  }
}
