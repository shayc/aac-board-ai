import { getSpokenText } from "../board-button";
import {
  createSpokenPartTracker,
  type SpokenPart,
  type SpokenPartTracker,
} from "./spoken-part-tracker";
import type { MessagePart } from "./use-message";

export type PlaybackStep =
  | { kind: "sound"; partId: string; src: string }
  | { kind: "speech"; tracker: SpokenPartTracker };

export function planPlayback(parts: MessagePart[]): PlaybackStep[] {
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
