import type { BoardAction, BoardButton } from "@features/board/types";
import { useSpeech } from "@shared/contexts/SpeechProvider/useSpeech";
import { useAudio } from "@shared/hooks/useAudio";
import type { MessagePart } from "./useMessage";

type ActionHandler = () => void | Promise<void>;

export interface UseButtonActivationOptions {
  navigateToBoard: (id: string) => void;
  addMessage: (part: MessagePart) => void;
  updateLastMessage: (part: Partial<MessagePart>) => void;
  addSpace: () => void;
  clearMessage: () => void;
  navigateHome: () => void;
  playMessage: () => Promise<void>;
  removeLastMessage: () => void;
  message: MessagePart[];
}

export interface UseButtonActivationReturn {
  activateButton: (button: BoardButton) => Promise<void>;
}

export function useButtonActivation({
  navigateToBoard,
  addMessage,
  updateLastMessage,
  addSpace,
  clearMessage,
  navigateHome,
  playMessage,
  removeLastMessage,
  message,
}: UseButtonActivationOptions): UseButtonActivationReturn {
  const speech = useSpeech();
  const audio = useAudio();

  const actionHandlers: Record<string, ActionHandler> = {
    ":space": addSpace,
    ":clear": clearMessage,
    ":home": navigateHome,
    ":speak": playMessage,
    ":backspace": removeLastMessage,
  };

  async function executeAction(action: BoardAction) {
    if (action.startsWith("+")) {
      const text = action.slice(1).trim();

      updateLastMessage({
        id: text,
        label: `${message[message.length - 1]?.label ?? ""}${text}`,
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

    addMessage(messagePart);

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
