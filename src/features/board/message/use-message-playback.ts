import { useAudio } from "@shared/hooks/use-audio";
import { speak, stop as stopSpeaking } from "@shared/speech/speech-store";
import { useState } from "react";
import { getSpokenText } from "../types";
import type { MessagePart } from "./use-message";

type PlaybackSegment =
  | { kind: "sound"; src: string }
  | { kind: "text"; text: string };

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
        if (segment.kind === "sound") {
          await audio.play(segment.src);
        }

        if (segment.kind === "text") {
          await speak(segment.text);
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
      return { kind: "sound" as const, src: part.soundSrc };
    }

    const text = getSpokenText(part);
    if (text) {
      return { kind: "text" as const, text };
    }

    return [];
  });

  return mergeTextSegments(segments);
}

function mergeTextSegments(segments: PlaybackSegment[]): PlaybackSegment[] {
  const result: PlaybackSegment[] = [];

  for (const segment of segments) {
    const previous = result.at(-1);
    const canMerge = previous?.kind === "text" && segment.kind === "text";

    if (canMerge) {
      previous.text = `${previous.text} ${segment.text}`.replace(/\s+/g, " ");
    } else {
      result.push({ ...segment });
    }
  }

  return result;
}
