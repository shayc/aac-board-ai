import { getSpeechConfig, getVoices } from "@shared/speech/speech-store";
import { getSpeechSynthesis } from "@shared/speech/speech-synthesis";

interface SpeakOptions {
  signal?: AbortSignal;
  onBoundary?: (charIndex: number) => void;
}

function buildUtterance(text: string): SpeechSynthesisUtterance {
  const voices = getVoices();
  const { voiceURI, rate, pitch, volume } = getSpeechConfig();

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
  let settled = false;

  const onAbort = () => {
    synthesis.cancel();
    finish();
  };

  function finish() {
    if (settled) {
      return;
    }

    settled = true;
    utterance.onend = null;
    utterance.onerror = null;
    utterance.onboundary = null;
    signal?.removeEventListener("abort", onAbort);

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
  signal?.addEventListener("abort", onAbort, { once: true });

  synthesis.speak(utterance);

  return promise;
}
