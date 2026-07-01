import type { MessagePartContent } from "../message/use-message";
import { getNavigationTargetId, getSpokenText } from "../board-button";
import type { BoardAction, BoardButton } from "../types";

export type ButtonIntent =
  | { kind: "navigate"; targetBoardId: string }
  | { kind: "compose"; content: MessagePartContent }
  | { kind: "playAudio"; src: string }
  | { kind: "speakText"; text: string }
  | { kind: "runAction"; action: BoardAction };

export function resolveButtonIntents(button: BoardButton): ButtonIntent[] {
  const targetBoardId = getNavigationTargetId(button);
  if (targetBoardId) {
    return [{ kind: "navigate", targetBoardId }];
  }

  if (button.actions?.length) {
    return button.actions.map((action) => ({ kind: "runAction", action }));
  }

  const intents: ButtonIntent[] = [
    { kind: "compose", content: toPartContent(button) },
  ];

  if (button.soundSrc) {
    intents.push({ kind: "playAudio", src: button.soundSrc });
  } else {
    const text = getSpokenText(button);
    if (text) {
      intents.push({ kind: "speakText", text });
    }
  }

  return intents;
}

function toPartContent(button: BoardButton): MessagePartContent {
  return {
    label: button.label,
    vocalization: button.vocalization,
    imageSrc: button.imageSrc,
    soundSrc: button.soundSrc,
  };
}
