import { useSpeech } from "@/shared/contexts/SpeechProvider/SpeechProvider";
import { useAudio } from "@/shared/hooks/useAudio";
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
  const [messageParts, setMessageParts] = useState<MessagePart[]>([]);
  const speech = useSpeech();
  const audio = useAudio();

  const isPlaying = speech.isSpeaking || audio.isPlaying;

  function appendPart(part: MessagePart) {
    setMessageParts((previousParts) => [...previousParts, part]);
  }

  function popPart() {
    setMessageParts((previousParts) => previousParts.slice(0, -1));
  }

  function clear() {
    setMessageParts([]);
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

  async function play() {
    const segments = convertPartsToSegments(messageParts);

    for (const seg of segments) {
      if (seg.type === "sound") {
        await audio.play(seg.data);
      }

      if (seg.type === "text") {
        await speech.speak(seg.data);
      }
    }
  }

  return {
    parts: messageParts,
    appendPart,
    popPart,
    clear,
    play,
    isPlaying,
  };
}
