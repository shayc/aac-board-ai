import { useAudio } from "@shared/hooks/useAudio";
import { useSpeech } from "@shared/speech/useSpeech";
import type { MessagePart, UseMessageReturn } from "./message/useMessage";
import type { UseMessagePlaybackReturn } from "./message/useMessagePlayback";
import type { UseBoardNavigationReturn } from "./navigation/useBoardNavigation";
import type { BoardAction, BoardButton } from "./types";

export interface UseButtonActivationOptions {
  message: UseMessageReturn;
  playback: UseMessagePlaybackReturn;
  navigation: UseBoardNavigationReturn;
}

export interface UseButtonActivationReturn {
  activateButton: (button: BoardButton) => Promise<void>;
}

export type ButtonIntent =
  | { kind: "navigate"; boardId: string }
  | { kind: "actions"; actions: BoardAction[] }
  | { kind: "utter"; button: BoardButton };

export function resolveButtonIntent(button: BoardButton): ButtonIntent {
  if (button.loadBoard?.id) {
    return { kind: "navigate", boardId: button.loadBoard.id };
  }

  if (button.actions?.length) {
    return { kind: "actions", actions: button.actions };
  }

  return { kind: "utter", button };
}

export function useButtonActivation({
  message,
  playback,
  navigation,
}: UseButtonActivationOptions): UseButtonActivationReturn {
  const speech = useSpeech();
  const audio = useAudio();

  async function activateButton(button: BoardButton) {
    const intent = resolveButtonIntent(button);

    switch (intent.kind) {
      case "navigate":
        navigation.goToBoard(intent.boardId);
        return;
      case "actions":
        for (const action of intent.actions) {
          await executeAction(action);
        }
        return;
      case "utter":
        message.addPart(toMessagePart(intent.button));
        playButtonAudio(intent.button);
        return;
      default: {
        const _exhaustive: never = intent;
        throw new Error(
          `Unhandled button intent: ${JSON.stringify(_exhaustive)}`,
        );
      }
    }
  }

  async function executeAction(action: BoardAction) {
    switch (action) {
      case ":space":
        message.addSpace();
        return;
      case ":backspace":
        message.removeLastPart();
        return;
      case ":speak":
        await playback.play();
        return;
      case ":clear":
        message.clear();
        return;
      case ":home":
        navigation.goHome();
        return;
      default:
        handleSpellingAction(action);
    }
  }

  function handleSpellingAction(action: string) {
    if (!action.startsWith("+")) {
      return;
    }

    const text = action.slice(1).trim();
    const lastPart = message.parts.at(-1);

    message.updateLastPart({
      id: text,
      label: `${lastPart?.label ?? ""}${text}`,
    });
  }

  function playButtonAudio(button: BoardButton) {
    if (button.soundSrc) {
      void audio.play(button.soundSrc);
      return;
    }

    const text = button.vocalization ?? button.label;

    if (text) {
      void speech.speak(text.toLowerCase());
    }
  }

  return {
    activateButton,
  };
}

function toMessagePart(button: BoardButton): MessagePart {
  return {
    id: button.id,
    label: button.label,
    vocalization: button.vocalization,
    imageSrc: button.imageSrc,
    soundSrc: button.soundSrc,
  };
}
