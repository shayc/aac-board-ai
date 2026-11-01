import { getSpeechConfig, getVoices } from "@shared/speech/speech-store";
import { getSpeechSynthesis } from "@shared/speech/speech-synthesis";
import type { PlaybackOutcome } from "../playback-context";

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
): Promise<PlaybackOutcome> {
  if (signal?.aborted) {
    return Promise.resolve("interrupted");
  }

  const synthesis = getSpeechSynthesis();
  if (!synthesis) {
    return Promise.resolve("failed");
  }

  const { promise, resolve } = Promise.withResolvers<PlaybackOutcome>();
  const utterance = buildUtterance(text);
  let settled = false;

  const onAbort = () => {
    finish("interrupted");
    synthesis.cancel();
  };

  function finish(outcome: PlaybackOutcome) {
    if (settled) {
      return;
    }

    settled = true;
    utterance.onend = null;
    utterance.onerror = null;
    utterance.onboundary = null;
    signal?.removeEventListener("abort", onAbort);

    resolve(outcome);
  }

  if (onBoundary) {
    utterance.onboundary = (event) => {
      if (!signal?.aborted) {
        onBoundary(event.charIndex);
      }
    };
  }

  utterance.onend = () => finish("completed");
  utterance.onerror = () => finish("failed");
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    synthesis.speak(utterance);
  } catch {
    finish("failed");
  }

  return promise;
}
