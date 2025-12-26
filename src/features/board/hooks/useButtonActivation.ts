import type { BoardAction, BoardButton } from "@features/board/types";
import { useSpeech } from "@shared/contexts/SpeechProvider/useSpeech";
import { useAudio } from "@shared/hooks/useAudio";
import type { MessagePart } from "./useMessage";

type ActionHandler = () => void | Promise<void>;

export interface ButtonActivationOptions {
  message: MessagePart[];
  addMessage: (part: MessagePart) => void;
  updateLastMessage: (part: Partial<MessagePart>) => void;
  addSpace: () => void;
  clearMessage: () => void;
  removeLastMessage: () => void;
  playMessage: () => Promise<void>;
  navigateToBoard: (id: string) => void;
  navigateHome: () => void;
}

export function useButtonActivation(deps: ButtonActivationOptions): {
  activateButton: (button: BoardButton) => Promise<void>;
} {
  const speech = useSpeech();
  const audio = useAudio();

  const {
    message,
    addMessage,
    updateLastMessage,
    addSpace,
    clearMessage,
    removeLastMessage,
    playMessage,
    navigateToBoard,
    navigateHome,
  } = deps;

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

  return { activateButton };
}
