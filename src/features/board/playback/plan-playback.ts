import type { PlaybackStep, SpeechStep } from "@shared/playback/playback-types";
import type { MessagePart } from "../message/message-types";

interface SpokenPart {
  id: string;
  text: string;
  language: string | undefined;
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
    const text = getSpokenText(part);

    if (part.kind === "tile" && part.soundSrc) {
      flushSpeech();
      steps.push({
        kind: "audio",
        src: part.soundSrc,
        cue: part.id,
        fallback: text ? { text, language: part.language } : undefined,
      });

      continue;
    }

    if (!text) {
      continue;
    }

    // An utterance has one language and voice, so a change of language starts
    // a new one.
    if (spokenRun[0] && spokenRun[0].language !== part.language) {
      flushSpeech();
    }

    spokenRun.push({ id: part.id, text, language: part.language });
  }

  flushSpeech();

  return steps;
}

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
    chunks.push(part.text);
    spans.push({ id: part.id, start: offset, end: offset + part.text.length });
    offset += part.text.length + 1;
  }

  return {
    kind: "speech",
    text: chunks.join(" "),
    language: parts[0]?.language,
    cueAt: (charIndex) =>
      spans.find((span) => charIndex >= span.start && charIndex < span.end)
        ?.id ?? null,
  };
}

function getSpokenText(part: MessagePart): string {
  const text =
    part.kind === "tile" ? (part.vocalization ?? part.label) : part.label;

  return text.trim().replace(/\s+/g, " ").toLowerCase();
}
