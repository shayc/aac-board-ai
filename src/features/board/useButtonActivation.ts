import { useAudio } from "@shared/hooks/useAudio";
import { useSpeech } from "@shared/speech/useSpeech";
import type { UseMessageReturn } from "./message/useMessage";
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

export function useButtonActivation({
  message,
  playback,
  navigation,
}: UseButtonActivationOptions): UseButtonActivationReturn {
  const speech = useSpeech();
  const audio = useAudio();

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

  async function activateButton(button: BoardButton) {
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
  }

  return {
    activateButton,
  };
}
