import type { BoardAction, BoardButton } from "@features/board/types";
import { useSpeech } from "@shared/contexts/SpeechProvider/useSpeech";
import { useAudio } from "@shared/hooks/useAudio";
import type { MessagePart } from "./useMessage";

type ActionHandler = () => void | Promise<void>;

export interface UseButtonActivationOptions {
  navigateToBoard: (id: string) => void;
  addPart: (part: MessagePart) => void;
  updateLastPart: (part: MessagePart) => void;
  addSpace: () => void;
  clearMessage: () => void;
  navigateHome: () => void;
  playMessage: () => Promise<void>;
  removeLastPart: () => void;
  message: MessagePart[];
}

export interface UseButtonActivationReturn {
  activateButton: (button: BoardButton) => Promise<void>;
}

export function useButtonActivation({
  navigateToBoard,
  addPart,
  updateLastPart,
  addSpace,
  clearMessage,
  navigateHome,
  playMessage,
  removeLastPart,
  message,
}: UseButtonActivationOptions): UseButtonActivationReturn {
  const speech = useSpeech();
  const audio = useAudio();

  const actionHandlers: Record<string, ActionHandler> = {
    ":space": addSpace,
    ":clear": clearMessage,
    ":home": navigateHome,
    ":speak": playMessage,
    ":backspace": removeLastPart,
  };

  async function executeAction(action: BoardAction) {
    if (action.startsWith("+")) {
      const text = action.slice(1).trim();
      const lastPart = message.at(-1);

      updateLastPart({
        id: text,
        label: `${lastPart?.label ?? ""}${text}`,
      });

      return;
    }

    const handler = actionHandlers[action];
    await handler?.();
  }

  const activateButton = async (button: BoardButton) => {
    if (button.loadBoard?.id) {
      navigateToBoard(button.loadBoard.id);
      return;
    }

    if (button.actions?.length) {
      for (const action of button.actions) {
        await executeAction(action);
      }

      return;
    }

    const messagePart = {
      id: button.id,
      label: button.label,
      imageSrc: button.imageSrc,
      soundSrc: button.soundSrc,
      vocalization: button.vocalization,
    };

    addPart(messagePart);

    if (button.soundSrc) {
      void audio.play(button.soundSrc);
      return;
    }

    const text = button.vocalization ?? button.label;

    if (text) {
      void speech.speak(text.toLowerCase());
    }
  };

  return {
    activateButton,
  };
}
