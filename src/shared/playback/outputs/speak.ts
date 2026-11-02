import { getSpeechPreferences, getVoices } from "@shared/speech/speech-store";
import { getSpeechSynthesis } from "@shared/speech/speech-synthesis";

interface SpeakOptions {
  signal?: AbortSignal;
  onBoundary?: (charIndex: number) => void;
}

function buildUtterance(text: string): SpeechSynthesisUtterance {
  const voices = getVoices();
  const { voiceURI, rate, pitch, volume } = getSpeechPreferences();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voices.find((voice) => voice.voiceURI === voiceURI) ?? null;
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
  let isSettled = false;

  const handleAbort = () => {
    synthesis.cancel();
    finish();
  };

  function finish() {
    if (isSettled) {
      return;
    }

    isSettled = true;
    utterance.onend = null;
    utterance.onerror = null;
    utterance.onboundary = null;
    signal?.removeEventListener("abort", handleAbort);

    resolve();
  }

  if (onBoundary) {
    utterance.onboundary = (event) => {
      if (!signal?.aborted) {
        onBoundary(event.charIndex);
      }
    };
  }

  utterance.onend = finish;
  utterance.onerror = finish;
  signal?.addEventListener("abort", handleAbort, { once: true });

  synthesis.speak(utterance);

  return promise;
}
