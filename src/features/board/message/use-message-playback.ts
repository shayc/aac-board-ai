import { useAudio } from "@shared/hooks/use-audio";
import { speak, stop as stopSpeaking } from "@shared/speech/speech-store";
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
  const audio = useAudio();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePartId, setActivePartId] = useState<string | null>(null);
  // Bumped by stop() (and each play()) to invalidate an in-flight loop: a
  // superseded utterance resolves via cancel(), so without this the loop would
  // march on to the next step after the user stopped.
  const playbackGenerationRef = useRef(0);

  async function play() {
    const generation = ++playbackGenerationRef.current;

    try {
      setIsPlaying(true);

      for (const step of planPlayback(parts)) {
        if (playbackGenerationRef.current !== generation) {
          return;
        }

        switch (step.kind) {
          case "sound":
            setActivePartId(step.partId);
            await audio.play(step.src);
            break;

          case "speech": {
            const { tracker } = step;
            setActivePartId(tracker.firstId);
            await speak(tracker.text, {
              onBoundary: (charIndex) => {
                // A boundary event can arrive after stop()/cancel(); ignore it
                // so it can't re-highlight a part the user already stopped.
                if (playbackGenerationRef.current === generation) {
                  setActivePartId(tracker.partIdAt(charIndex));
                }
              },
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
      // Playback failures (TTS hiccup, cancellation from stop(), etc.) reset
      // via `finally` — the button returning to idle is the user signal.
    } finally {
      if (playbackGenerationRef.current === generation) {
        setIsPlaying(false);
        setActivePartId(null);
      }
    }
  }

  function stop() {
    playbackGenerationRef.current++;
    stopSpeaking();
    audio.stop();
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
