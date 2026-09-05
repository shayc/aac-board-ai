import type { PlaybackStep } from "@shared/playback/playback-types";
import type { MessagePart } from "../message/message-types";
import {
  createSpokenPartTracker,
  type SpokenPart,
  type SpokenPartTracker,
} from "./spoken-part-tracker";

function getSpokenText(part: MessagePart): string | undefined {
  return (part.vocalization ?? part.label)?.toLowerCase();
}

export function planPlayback(parts: readonly MessagePart[]): PlaybackStep[] {
  const steps: PlaybackStep[] = [];
  let spokenRun: SpokenPart[] = [];

  function flushSpeech() {
    if (spokenRun.length === 0) {
      return;
    }

    const tracker: SpokenPartTracker = createSpokenPartTracker(spokenRun);
    steps.push({
      kind: "speech",
      text: tracker.text,
      trackingKeyAt: tracker.partIdAt,
    });
    spokenRun = [];
  }

  for (const part of parts) {
    if (part.sound) {
      flushSpeech();
      steps.push({
        kind: "audio",
        src: part.sound,
        trackingKey: part.id,
      });
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
