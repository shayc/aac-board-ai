import { playAudio } from "@shared/audio/play-audio";
import { speak } from "@shared/speech/speech-store";
import { useRef, useState } from "react";
import { getSpokenText } from "../types";
import {
  createPartTracker,
  type PartTracker,
  type SpokenPart,
} from "./part-tracker";
import type { MessagePart } from "./use-message";

type PlaybackStep =
  | { kind: "sound"; partId: string; src: string }
  | { kind: "speech"; tracker: PartTracker };

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
  // The token for the current playback. stop() (and each new play()) aborts it,
  // which stops the in-flight step and ends the loop below.
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
            setActivePartId(tracker.firstId);
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
      // A genuine playback failure (a TTS hiccup, a missing sound) resets via
      // `finally` — the button returning to idle is feedback enough.
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

// Consecutive spoken parts merge into one utterance for prosody; building each
// run's tracker here keeps play() a plain interpreter over the steps.
function planPlayback(parts: MessagePart[]): PlaybackStep[] {
  const steps: PlaybackStep[] = [];
  let spokenRun: SpokenPart[] = [];

  function flushSpeech() {
    if (spokenRun.length === 0) {
      return;
    }

    steps.push({ kind: "speech", tracker: createPartTracker(spokenRun) });
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
