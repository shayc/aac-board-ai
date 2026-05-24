import { useAudio } from "@shared/hooks/use-audio";
import { speak } from "@shared/speech/speech-store";
import type { MessagePart, UseMessageReturn } from "./message/use-message";
import type { UseMessagePlaybackReturn } from "./message/use-message-playback";
import type { UseBoardNavigationReturn } from "./navigation/use-board-navigation";
import { getSpokenText, type BoardAction, type BoardButton } from "./types";

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
  const audio = useAudio();

  async function activateButton(button: BoardButton) {
    const targetBoardId = button.loadBoard?.id;
    if (targetBoardId) {
      navigation.goToBoard(targetBoardId);
      return;
    }

    if (button.actions?.length) {
      for (const action of button.actions) {
        await runAction(action);
      }
      return;
    }

    message.addPart(asMessagePart(button));
    speakButton(button);
  }

  async function runAction(action: BoardAction) {
    switch (action.kind) {
      case "space":
        return message.addSpace();
      case "backspace":
        return message.removeLastPart();
      case "clear":
        return message.clear();
      case "home":
        return navigation.goHome();
      case "speak":
        return playback.play();
      case "spell":
        return appendToLastPart(action.text);
    }
  }

  function appendToLastPart(text: string) {
    const lastPart = message.parts.at(-1);
    message.updateLastPart({
      id: text,
      label: `${lastPart?.label ?? ""}${text}`,
    });
  }

  function speakButton(button: BoardButton) {
    if (button.soundSrc) {
      void audio.play(button.soundSrc);
      return;
    }

    const text = getSpokenText(button);
    if (text) {
      void speak(text.toLowerCase());
    }
  }

  return { activateButton };
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
