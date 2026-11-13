import type { PlaybackStep } from "@shared/playback/playback-types";
import type { MessagePart } from "../message/message-types";
import { joinSpokenParts, type SpokenPart } from "./join-spoken-parts";

export function planPlayback(parts: readonly MessagePart[]): PlaybackStep[] {
  const steps: PlaybackStep[] = [];
  let spokenRun: SpokenPart[] = [];

  function flushSpeech() {
    if (spokenRun.length === 0) {
      return;
    }

    const joined = joinSpokenParts(spokenRun);
    steps.push({
      kind: "speech",
      text: joined.text,
      cueAt: joined.partIdAt,
    });
    spokenRun = [];
  }

  for (const part of parts) {
    if (part.kind === "tile" && part.soundSrc) {
      flushSpeech();
      steps.push({
        kind: "audio",
        src: part.soundSrc,
        cue: part.id,
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

function getSpokenText(part: MessagePart): string {
  const text =
    part.kind === "tile" ? (part.vocalization ?? part.label) : part.label;

  return text.trim().toLowerCase();
}
