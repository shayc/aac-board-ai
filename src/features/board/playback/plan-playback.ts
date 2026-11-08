import type { PlaybackStep } from "@shared/playback/playback-types";
import type { MessagePart } from "../message/message-types";
import { joinSpokenParts, type SpokenPart } from "./join-spoken-parts";

interface SpokenRun {
  language: string;
  parts: SpokenPart[];
}

function getSpokenText(part: MessagePart): string {
  return (part.vocalization ?? part.label).toLowerCase();
}

export function planPlayback(parts: MessagePart[]): PlaybackStep[] {
  const steps: PlaybackStep[] = [];
  let spokenRun: SpokenRun | null = null;

  function flushSpeech() {
    if (!spokenRun) {
      return;
    }

    const joined = joinSpokenParts(spokenRun.parts);
    steps.push({
      kind: "speech",
      text: joined.text,
      language: spokenRun.language,
      cueAt: joined.partIdAt,
    });
    spokenRun = null;
  }

  for (const part of parts) {
    if (part.soundSrc) {
      flushSpeech();
      steps.push({
        kind: "audio",
        src: part.soundSrc,
        cue: part.id,
      });
      continue;
    }

    const text = getSpokenText(part);
    if (!text) {
      continue;
    }

    if (!spokenRun || spokenRun.language !== part.language) {
      flushSpeech();
      spokenRun = { language: part.language, parts: [] };
    }

    spokenRun.parts.push({ id: part.id, text });
  }

  flushSpeech();

  return steps;
}
