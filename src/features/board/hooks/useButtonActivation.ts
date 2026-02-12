import type { BoardAction, BoardButton } from "@features/board/types";
import { useSpeech } from "@shared/contexts/SpeechProvider/useSpeech";
import { useAudio } from "@shared/hooks/useAudio";
import type { UseBoardNavigationReturn } from "./useBoardNavigation";
import type { UseMessageReturn } from "./useMessage";
import type { UseMessagePlaybackReturn } from "./useMessagePlayback";

export interface UseButtonActivationOptions {
  message: UseMessageReturn;
  playback: UseMessagePlaybackReturn;
  navigation: UseBoardNavigationReturn;
}

export interface UseButtonActivationReturn {
  activateButton: (button: BoardButton) => Promise<void>;
}

export function useButtonActivation({
  message,
  playback,
  navigation,
}: UseButtonActivationOptions): UseButtonActivationReturn {
  const speech = useSpeech();
  const audio = useAudio();

  async function executeAction(action: BoardAction) {
    const actionHandlers: Record<BoardAction, () => void | Promise<void>> = {
      ":space": message.addSpace,
      ":backspace": message.removeLastPart,
      ":speak": playback.play,
      ":clear": message.clear,
      ":home": navigation.goHome,
    };

    if (action.startsWith("+")) {
      const text = action.slice(1).trim();
      const lastPart = message.parts.at(-1);

      message.updateLastPart({
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
      navigation.goToBoard(button.loadBoard.id);
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
      vocalization: button.vocalization,
      imageSrc: button.imageSrc,
      soundSrc: button.soundSrc,
    };

    message.addPart(messagePart);

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
