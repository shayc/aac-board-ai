import { getStoredLanguage } from "@shared/language/language-store";
import { getLanguageCode } from "@shared/language/locale";
import { getSpeechPreferences, getVoices } from "@shared/speech/speech-store";
import { getSpeechSynthesis } from "@shared/speech/speech-synthesis";

interface SpeakOptions {
  signal?: AbortSignal;
  onBoundary?: (charIndex: number) => void;
}

function findVoiceForLanguage(
  voiceURI: string | null,
  language: string,
): SpeechSynthesisVoice | null {
  const voice = getVoices().find((voice) => voice.voiceURI === voiceURI);
  if (!voice || getLanguageCode(voice.lang) !== getLanguageCode(language)) {
    return null;
  }

  return voice;
}

function buildUtterance(text: string): SpeechSynthesisUtterance {
  const language = getStoredLanguage();
  const { voiceURI, rate, pitch, volume } = getSpeechPreferences();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = language;
  utterance.voice = findVoiceForLanguage(voiceURI, language);
  utterance.rate = rate;
  utterance.pitch = pitch;
  utterance.volume = volume;

  return utterance;
}

export function speak(
  text: string,
  { signal, onBoundary }: SpeakOptions = {},
): Promise<void> {
  const synthesis = getSpeechSynthesis();
  if (!synthesis || signal?.aborted) {
    return Promise.resolve();
  }

  const { promise, resolve } = Promise.withResolvers<void>();
  const utterance = buildUtterance(text);
  const settled = new AbortController();
  const listenerOptions = { signal: settled.signal };

  function finish() {
    settled.abort();
    resolve();
  }

  if (onBoundary) {
    utterance.addEventListener(
      "boundary",
      (event) => onBoundary(event.charIndex),
      listenerOptions,
    );
  }

  utterance.addEventListener("end", finish, listenerOptions);
  utterance.addEventListener("error", finish, listenerOptions);
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
