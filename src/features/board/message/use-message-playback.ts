import { playAudio } from "@shared/audio/play-audio";
import { speak } from "@shared/speech/speech-store";
import { useRef, useState } from "react";
import { getSpokenText } from "../board-button";
import {
  createSpokenPartTracker,
  type SpokenPart,
  type SpokenPartTracker,
} from "./spoken-part-tracker";
import type { MessagePart } from "./use-message";

type PlaybackStep =
  | { kind: "sound"; partId: string; src: string }
  | { kind: "speech"; tracker: SpokenPartTracker };

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

function planPlayback(parts: MessagePart[]): PlaybackStep[] {
  const steps: PlaybackStep[] = [];
  let spokenRun: SpokenPart[] = [];

  function flushSpeech() {
    if (spokenRun.length === 0) {
      return;
    }

    steps.push({ kind: "speech", tracker: createSpokenPartTracker(spokenRun) });
    spokenRun = [];
  }

  for (const part of parts) {
    if (part.soundSrc) {
      flushSpeech();
      steps.push({ kind: "sound", partId: part.id, src: part.soundSrc });
      continue;
    }

    const text = getSpokenText(part);
    if (text) {
      spokenRun.push({ id: part.id, text });
    }
  }

  flushSpeech();

  return steps;
}
