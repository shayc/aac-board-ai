import { getLanguageCode } from "@shared/language/locale";
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

    steps.push(buildSpeechStep(speechRun, firstPart.language));
    speechRun = [];
  }

  for (const part of parts) {
    const language = part.language ?? defaultLanguage;
    const text = getSpokenText(part, language);

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

    // An utterance has one language and one voice, so a run ends where the
    // language changes.
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

// A lone part stays highlighted for the whole utterance, while several parts
// wait for word boundaries so a voice without them shows no stale highlight.
function buildSpeechStep(
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

// Keep Safari from speaking "I" as "Capital I".
function getSpokenText(part: MessagePart, language: string): string {
  const raw =
    part.kind === "tile" ? (part.vocalization ?? part.label) : part.label;
  const text = raw.trim().replace(/\s+/g, " ");

  return text.length === 1 && getLanguageCode(language) === "en"
    ? text.toLowerCase()
    : text;
}
