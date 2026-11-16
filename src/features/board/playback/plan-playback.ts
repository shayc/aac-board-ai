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
    const [firstPart] = spokenRun;
    if (!firstPart) {
      return;
    }

    steps.push(createSpeechStep(spokenRun, firstPart.language));
    spokenRun = [];
  }

  for (const part of parts) {
    const text = getSpokenText(part);
    const { language } = part;

    if (part.kind === "tile" && part.soundSrc) {
      flushSpeech();
      steps.push({
        kind: "audio",
        src: part.soundSrc,
        cue: part.id,
        fallbackText: text || undefined,
        fallbackLanguage: language,
      });

      continue;
    }

    if (!text) {
      continue;
    }

    // An utterance has one language and one voice, so a run ends where the
    // language changes.
    if (spokenRun.at(-1)?.language !== language) {
      flushSpeech();
    }

    spokenRun.push({ id: part.id, text, language });
  }

  flushSpeech();

  return steps;
}

interface PartSpan {
  id: string;
  start: number;
  end: number;
}

function createSpeechStep(
  parts: readonly SpokenPart[],
  language: string | undefined,
): SpeechStep {
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
    language,
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
