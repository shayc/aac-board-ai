import { useSpeech } from "@shared/contexts/SpeechProvider/useSpeech";
import { useAudio } from "@shared/hooks/useAudio";
import { useState } from "react";
import type { MessagePart } from "./useMessage";

interface PlaybackSegment {
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

      for (const segment of segments) {
        if (segment.type === "sound") {
          await audio.play(segment.data);
        }

        if (segment.type === "text") {
          await speech.speak(segment.data);
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

function convertPartsToSegments(parts: MessagePart[]): PlaybackSegment[] {
  const segments = parts.flatMap((part) => {
    if (part.soundSrc) {
      return { type: "sound" as const, data: part.soundSrc };
    }

    const text = part.vocalization ?? part.label;
    if (text) {
      return { type: "text" as const, data: text };
    }

    return [];
  });

  return mergeTextSegments(segments);
}

function mergeTextSegments(segments: PlaybackSegment[]): PlaybackSegment[] {
  const result: PlaybackSegment[] = [];

  for (const segment of segments) {
    const previous = result.at(-1);
    const canMerge = previous?.type === "text" && segment.type === "text";

    if (canMerge) {
      previous.data = `${previous.data} ${segment.data}`.replace(/\s+/g, " ");
    } else {
      result.push({ ...segment });
    }
  }

  return result;
}
