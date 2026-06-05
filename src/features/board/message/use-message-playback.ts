import { playAudio } from "@shared/audio/play-audio";
import { speak } from "@shared/speech/speech-store";
import { useRef, useState } from "react";
import { planPlayback } from "./plan-playback";
import type { MessagePart } from "./use-message";

export interface UseMessagePlaybackReturn {
  isPlaying: boolean;
  activePartId: string | null;
  play: () => Promise<void>;
  stop: () => void;
}

export function useMessagePlayback(
  parts: MessagePart[],
): UseMessagePlaybackReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePartId, setActivePartId] = useState<string | null>(null);
  const playbackRef = useRef<AbortController | null>(null);

  async function play() {
    playbackRef.current?.abort();
    const controller = new AbortController();
    playbackRef.current = controller;
    const { signal } = controller;

    try {
      setIsPlaying(true);

      for (const step of planPlayback(parts)) {
        if (signal.aborted) {
          return;
        }

        switch (step.kind) {
          case "sound":
            setActivePartId(step.partId);
            await playAudio(step.src, { signal });
            break;

          case "speech": {
            const { tracker } = step;
            await speak(tracker.text, {
              signal,
              onBoundary: (charIndex) =>
                setActivePartId(tracker.partIdAt(charIndex)),
            });
            break;
          }

          default: {
            const _exhaustiveCheck: never = step;
            throw new Error(
              `Unhandled playback step: ${JSON.stringify(_exhaustiveCheck)}`,
            );
          }
        }
      }
    } catch {
      // Failure is surfaced by the reset in finally.
    } finally {
      if (!signal.aborted) {
        setIsPlaying(false);
        setActivePartId(null);
      }
    }
  }

  function stop() {
    playbackRef.current?.abort();
    setIsPlaying(false);
    setActivePartId(null);
  }

  return {
    isPlaying,
    activePartId,
    play,
    stop,
  };
}
