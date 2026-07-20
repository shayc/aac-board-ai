import { getNavigationTargetId } from "../button-readers";
import type { MessagePartContent } from "../message/message-types";
import type { BoardAction, BoardButton } from "../types";

type ButtonIntent =
  | { kind: "navigate"; targetBoardId: string }
  | { kind: "composeAndPlay"; content: MessagePartContent }
  | { kind: "runAction"; action: BoardAction };

export function resolveButtonIntents(button: BoardButton): ButtonIntent[] {
  const targetBoardId = getNavigationTargetId(button);
  if (targetBoardId) {
    return [{ kind: "navigate", targetBoardId }];
  }

  if (button.actions?.length) {
    return button.actions.map((action) => ({ kind: "runAction", action }));
  }

  return [{ kind: "composeAndPlay", content: toPartContent(button) }];
}

function toPartContent(button: BoardButton): MessagePartContent {
  return {
    label: button.label,
    vocalization: button.vocalization,
    imageSrc: button.imageSrc,
    soundSrc: button.soundSrc,
  };
}
