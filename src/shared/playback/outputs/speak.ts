import { getStoredLanguage } from "@shared/language/language-store";
import {
  getSpeechPreferences,
  getSpeechVoice,
} from "@shared/speech/speech-store";
import { getSpeechSynthesis } from "@shared/speech/speech-synthesis";

interface SpeakOptions {
  signal?: AbortSignal;
  onBoundary?: (charIndex: number) => void;
}

function buildUtterance(text: string): SpeechSynthesisUtterance {
  const { rate, pitch, volume } = getSpeechPreferences();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = getStoredLanguage();
  utterance.voice = getSpeechVoice();
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  return utterance;
}

export function speak(
  text: string,
  { signal, onBoundary }: SpeakOptions = {},
): Promise<void> {
  if (signal?.aborted) {
    return Promise.resolve();
  }

  const synthesis = getSpeechSynthesis();
  if (!synthesis) {
    return Promise.reject(new Error("Speech synthesis is unavailable"));
  }

  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const utterance = buildUtterance(text);
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

  if (onBoundary) {
    utterance.addEventListener(
      "boundary",
      (event) => onBoundary(event.charIndex),
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
