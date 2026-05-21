import { useAudio } from "@shared/hooks/use-audio";
import { speak, stop as stopSpeaking } from "@shared/speech/speech-store";
import { useState } from "react";
import type { MessagePart } from "./use-message";

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
          await speak(segment.data);
        }
      }
    } catch {
      // Playback failures (TTS hiccup, cancellation from stop(), etc.) reset
      // via `finally` — the button returning to idle is the user signal.
    } finally {
      setIsPlaying(false);
    }
  }

  function stop() {
    stopSpeaking();
    audio.stop();
    setIsPlaying(false);
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
