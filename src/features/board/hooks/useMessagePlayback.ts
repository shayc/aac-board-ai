import { useSpeech } from "@shared/contexts/SpeechProvider/useSpeech";
import { useAudio } from "@shared/hooks/useAudio";
import { useState } from "react";
import type { MessagePart } from "./useMessage";

interface Segment {
  type: "text" | "sound";
  data: string;
}

export interface UseMessagePlaybackReturn {
  isPlaying: boolean;
  play: () => Promise<void>;
  stop: () => void;
}

export function useMessagePlayback(
  parts: MessagePart[],
): UseMessagePlaybackReturn {
  const speech = useSpeech();
  const audio = useAudio();
  const [isPlaying, setIsPlaying] = useState(false);

  async function play() {
    try {
      setIsPlaying(true);
      const segments = convertPartsToSegments(parts);

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
    } finally {
      setIsPlaying(false);
    }
  }

  function stop() {
    try {
      speech.cancel();
      audio.stop();
    } catch (error) {
      console.error("Error stopping message:", error);
    } finally {
      setIsPlaying(false);
    }
  }

  return {
    isPlaying,
    play,
    stop,
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

    if (previousSegment?.type === "text" && currentSegment.type === "text") {
      previousSegment.data =
        `${previousSegment.data.trim()} ${currentSegment.data.trim()}`.replace(
          /\s+/g,
          " ",
        );
    } else {
      mergedSegments.push({ ...currentSegment });
    }
  }

  return mergedSegments;
}
