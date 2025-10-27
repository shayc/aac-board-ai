import { useSpeech } from "@/shared/contexts/SpeechProvider/SpeechProvider";
import { useAudio } from "@/shared/hooks/useAudio";
import { usePersistentState } from "@/shared/hooks/usePersistentState";
import { useState } from "react";

export type Segment = {
  type: "text" | "sound";
  data: string;
};

export interface MessagePart {
  id: string;
  label?: string;
  imageSrc?: string;
  soundSrc?: string;
  vocalization?: string;
}

export function useMessage() {
  const speech = useSpeech();
  const audio = useAudio();

  const [message, setMessage] = usePersistentState<MessagePart[]>(
    "message",
    []
  );

  const [isPlayingMessage, setIsPlayingMessage] = useState(false);

  function addMessage(part: MessagePart) {
    setMessage((prev) => [...prev, part]);
  }

  function removeLastMessage() {
    setMessage((prev) => prev.slice(0, -1));
  }

  function updateLastMessage(part: Partial<MessagePart>) {
    setMessage((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const updated = [...prev];
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        ...part,
      };

      return updated;
    });
  }

  function clearMessage() {
    setMessage([]);
  }

  function addSpace() {
    addMessage({
      id: "space", // TODO: unique ID
      label: "",
    });
  }
  async function stopMessage() {
    try {
      speech.cancel();
    } catch (error) {
      console.error("Error stopping message:", error);
    } finally {
      setIsPlayingMessage(false);
    }
  }

  async function playMessage() {
    try {
      setIsPlayingMessage(true);
      const segments = convertPartsToSegments(message);

      for (const seg of segments) {
        if (seg.type === "sound") {
          await audio.play(seg.data);
        }

        if (seg.type === "text") {
          await speech.speak(seg.data);
        }
      }
    } catch (error) {
      console.error("Error playing message:", error);
      setIsPlayingMessage(false);
    } finally {
      setIsPlayingMessage(false);
    }
  }

  return {
    message,
    isPlayingMessage,
    addMessage,
    addSpace,
    setMessage,
    removeLastMessage,
    updateLastMessage,
    clearMessage,
    playMessage,
    stopMessage,
  };
}

function convertPartsToSegments(parts: MessagePart[]): Segment[] {
  const segments = parts
    .map((part) => {
      if (part.soundSrc) {
        return { type: "sound", data: part.soundSrc };
      }

      const text = part.vocalization ?? part.label;
      if (text) {
        return { type: "text", data: text };
      }

      return null;
    })
    .filter((segment): segment is Segment => segment !== null);

  const mergedSegments = mergeTextSegments(segments);
  return mergedSegments;
}

function mergeTextSegments(segments: Segment[]): Segment[] {
  const mergedSegments: Segment[] = [];

  for (const currentSegment of segments) {
    const previousSegment = mergedSegments.at(-1);

    if (
      previousSegment &&
      previousSegment.type === "text" &&
      currentSegment.type === "text"
    ) {
      previousSegment.data =
        `${previousSegment.data.trim()} ${currentSegment.data.trim()}`.replace(
          /\s+/g,
          " "
        );
    } else {
      mergedSegments.push({ ...currentSegment });
    }
  }

  return mergedSegments;
}
