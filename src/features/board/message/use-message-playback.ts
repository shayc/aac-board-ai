import { useAudio } from "@shared/hooks/use-audio";
import { speak, stop as stopSpeaking } from "@shared/speech/speech-store";
import { useRef, useState } from "react";
import { getSpokenText } from "../types";
import { createPartTracker, type SpokenPart } from "./create-part-tracker";
import type { MessagePart } from "./use-message";

type PlaybackSegment =
  | { kind: "sound"; src: string; partId: string }
  | { kind: "text"; parts: SpokenPart[] };

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
  // march on to the next segment after the user stopped.
  const playbackGenerationRef = useRef(0);

  async function play() {
    const generation = ++playbackGenerationRef.current;

    try {
      setIsPlaying(true);
      const segments = convertPartsToSegments(parts);

      for (const segment of segments) {
        if (playbackGenerationRef.current !== generation) {
          return;
        }

        if (segment.kind === "sound") {
          setActivePartId(segment.partId);
          await audio.play(segment.src);
        }

        if (segment.kind === "text") {
          const tracker = createPartTracker(segment.parts);
          setActivePartId(tracker.firstId);
          await speak(tracker.text, {
            onBoundary: (charIndex) => {
              // A boundary event can arrive after stop()/cancel(); ignore it so
              // it can't re-highlight a part the user already stopped.
              if (playbackGenerationRef.current === generation) {
                setActivePartId(tracker.partAt(charIndex));
              }
            },
          });
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

function convertPartsToSegments(parts: MessagePart[]): PlaybackSegment[] {
  const segments: PlaybackSegment[] = [];

  for (const part of parts) {
    if (part.soundSrc) {
      segments.push({ kind: "sound", src: part.soundSrc, partId: part.id });
      continue;
    }

    const text = getSpokenText(part);
    if (!text) {
      continue;
    }

    const previous = segments.at(-1);
    if (previous?.kind === "text") {
      previous.parts.push({ id: part.id, text });
    } else {
      segments.push({ kind: "text", parts: [{ id: part.id, text }] });
    }
  }

  return segments;
}
