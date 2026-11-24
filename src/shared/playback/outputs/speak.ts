import {
  getSpeechSynthesis,
  type SpeechParameters,
  type SpeechText,
} from "@shared/speech/speech-synthesis";

interface SpeakOptions {
  signal?: AbortSignal;
  onWordBoundary?: (charIndex: number) => void;
}

export function speak(
  speechText: SpeechText,
  parameters: SpeechParameters,
  { signal, onWordBoundary }: SpeakOptions = {},
): Promise<void> {
  if (signal?.aborted) {
    return Promise.resolve();
  }

  const synthesis = getSpeechSynthesis();
  if (!synthesis) {
    return Promise.reject(new Error("Speech synthesis is unavailable"));
  }

  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const utterance = buildUtterance(speechText, parameters);
  const settled = new AbortController();
  const listenerOptions = { signal: settled.signal };

  function finish() {
    settled.abort();
    resolve();
  }

  function fail(event: SpeechSynthesisErrorEvent) {
    settled.abort();
    reject(new Error(`Speech failed: ${event.error}`, { cause: event }));
  }

  if (onWordBoundary) {
    utterance.addEventListener(
      "boundary",
      (event) => {
        if (event.name !== "sentence") {
          onWordBoundary(event.charIndex);
        }
      },
      listenerOptions,
    );
  }

  utterance.addEventListener("end", finish, listenerOptions);
  utterance.addEventListener("error", fail, listenerOptions);
  signal?.addEventListener(
    "abort",
    () => {
      synthesis.cancel();
      finish();
    },
    listenerOptions,
  );

  synthesis.speak(utterance);

  return promise;
}

function buildUtterance(
  { text, language }: SpeechText,
  { voice, rate, pitch, volume }: SpeechParameters,
): SpeechSynthesisUtterance {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.voice = voice;
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  return utterance;
}
