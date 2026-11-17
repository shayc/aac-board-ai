import type { PlaybackStep, SpeechStep } from "@shared/playback/playback-types";
import type { SpeechText } from "@shared/speech/speech-synthesis";
import type { MessagePart } from "../message/message-types";

interface SpeechPart extends SpeechText {
  id: string;
}

/** Parts in an unknown language are spoken as the default language. */
export function planPlayback(
  parts: readonly MessagePart[],
  defaultLanguage: string,
): PlaybackStep[] {
  const steps: PlaybackStep[] = [];
  let speechRun: SpeechPart[] = [];

  function flushSpeech() {
    const [firstPart] = speechRun;
    if (!firstPart) {
      return;
    }

    steps.push(createSpeechStep(speechRun, firstPart.language));
    speechRun = [];
  }

  for (const part of parts) {
    const text = getSpokenText(part);
    const language = part.language ?? defaultLanguage;

    if (part.kind === "tile" && part.soundSrc) {
      flushSpeech();
      steps.push({
        kind: "audio",
        src: part.soundSrc,
        cue: part.id,
        fallback: text ? { text, language } : undefined,
      });

      continue;
    }

    if (!text) {
      continue;
    }

    if (speechRun.at(-1)?.language !== language) {
      flushSpeech();
    }

    speechRun.push({ id: part.id, text, language });
  }

  flushSpeech();

  return steps;
}

interface PartSpan {
  id: string;
  end: number;
}

// Multi-part utterances highlight only on word boundaries so boundaryless voices don't stick on part 1.
function createSpeechStep(
  parts: readonly SpeechPart[],
  language: string,
): SpeechStep {
  const [firstPart] = parts;
  if (firstPart && parts.length === 1) {
    return {
      kind: "speech",
      text: firstPart.text,
      language,
      cue: firstPart.id,
    };
  }

  const chunks: string[] = [];
  const spans: PartSpan[] = [];
  let offset = 0;

  for (const part of parts) {
    chunks.push(part.text);
    spans.push({ id: part.id, end: offset + part.text.length });
    offset += part.text.length + 1;
  }

  return {
    kind: "speech",
    text: chunks.join(" "),
    language,
    // A boundary on the space between parts belongs to the word after it.
    cueAt: (charIndex) =>
      spans.find((span) => charIndex < span.end)?.id ?? null,
  };
}

function getSpokenText(part: MessagePart): string {
  const text =
    part.kind === "tile" ? (part.vocalization ?? part.label) : part.label;

  return text.trim().replace(/\s+/g, " ").toLowerCase();
}
