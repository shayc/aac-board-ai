import type { MessagePart } from "../message/use-message";
import { getSpokenText, type BoardAction, type BoardButton } from "../types";

export type ButtonIntent =
  | { kind: "navigate"; targetBoardId: string }
  | { kind: "compose"; part: MessagePart }
  | { kind: "playAudio"; src: string }
  | { kind: "speakText"; text: string }
  | { kind: "runAction"; action: BoardAction };

export function resolveButtonIntent(button: BoardButton): ButtonIntent[] {
  const intents: ButtonIntent[] = [];

  const targetBoardId = button.loadBoard?.id;
  if (targetBoardId) {
    intents.push({ kind: "navigate", targetBoardId });

    return intents;
  }

  if (button.actions?.length) {
    for (const action of button.actions) {
      intents.push({ kind: "runAction", action });
    }

    return intents;
  }

  intents.push({ kind: "compose", part: asMessagePart(button) });

  if (button.soundSrc) {
    intents.push({ kind: "playAudio", src: button.soundSrc });
  } else {
    const text = getSpokenText(button);
    if (text) {
      intents.push({ kind: "speakText", text: text.toLowerCase() });
    }
  }

  return intents;
}

function asMessagePart(button: BoardButton): MessagePart {
  return {
    id: button.id,
    label: button.label,
    vocalization: button.vocalization,
    imageSrc: button.imageSrc,
    soundSrc: button.soundSrc,
  };
}
