import { getSpeechConfig, getVoices } from "@shared/speech/speech-store";
import { getSpeechSynthesis } from "@shared/speech/speech-synthesis";
import type { PlaybackStepOutcome } from "../playback-types";

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
): Promise<PlaybackStepOutcome> {
  const synthesis = getSpeechSynthesis();
  if (signal?.aborted) {
    return Promise.resolve({ status: "interrupted" });
  }

  if (!synthesis) {
    return Promise.resolve({
      status: "failed",
      error: new Error("Speech synthesis is unavailable"),
    });
  }

  const { promise, resolve } = Promise.withResolvers<PlaybackStepOutcome>();
  const utterance = buildUtterance(text);
  let settled = false;

  const onAbort = () => {
    finish({ status: "interrupted" });
    synthesis.cancel();
  };

  function finish(outcome: PlaybackStepOutcome) {
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

  utterance.onend = () => finish({ status: "completed" });
  utterance.onerror = (event) => {
    const wasInterrupted =
      event.error === "interrupted" || event.error === "canceled";
    finish(
      wasInterrupted
        ? { status: "interrupted" }
        : { status: "failed", error: new Error(event.error) },
    );
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    synthesis.speak(utterance);
  } catch (error) {
    finish({
      status: "failed",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  return promise;
}
