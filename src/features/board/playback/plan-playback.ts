import type { PlaybackStep } from "@shared/playback/playback-types";
import type { MessagePart } from "../message/message-types";

interface SpokenPart {
  id: string;
  text: string;
}

export function planPlayback(parts: readonly MessagePart[]): PlaybackStep[] {
  const steps: PlaybackStep[] = [];
  let spokenRun: SpokenPart[] = [];

  function flushSpeech() {
    if (spokenRun.length === 0) {
      return;
    }

    steps.push(createSpeechStep(spokenRun));
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

type SpeechStep = Extract<PlaybackStep, { kind: "speech" }>;

interface PartSpan {
  id: string;
  start: number;
  end: number;
}

function createSpeechStep(parts: readonly SpokenPart[]): SpeechStep {
  const chunks: string[] = [];
  const spans: PartSpan[] = [];
  let offset = 0;

  for (const part of parts) {
    const chunk = part.text.trim().replace(/\s+/g, " ");
    chunks.push(chunk);
    spans.push({ id: part.id, start: offset, end: offset + chunk.length });
    offset += chunk.length + 1;
  }

  return {
    kind: "speech",
    text: chunks.join(" "),
    cueAt: (charIndex) =>
      spans.find((span) => charIndex >= span.start && charIndex < span.end)
        ?.id ?? null,
  };
}

function getSpokenText(part: MessagePart): string {
  const text =
    part.kind === "tile" ? (part.vocalization ?? part.label) : part.label;

  return text.trim().toLowerCase();
}
