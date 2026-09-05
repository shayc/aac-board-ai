import { acquireMediaUrl } from "@shared/media/acquire-media-url";
import type { MediaSource } from "@shared/media/media-source";
import type { PlaybackStepOutcome } from "../playback-types";

interface PlayAudioOptions {
  signal?: AbortSignal;
}

export function playAudio(
  src: MediaSource,
  { signal }: PlayAudioOptions = {},
): Promise<PlaybackStepOutcome> {
  if (signal?.aborted) {
    return Promise.resolve({ status: "interrupted" });
  }

  const { promise, resolve } = Promise.withResolvers<PlaybackStepOutcome>();
  const media = acquireMediaUrl(src);
  const audio = new Audio(media.url);
  let settled = false;

  function finish(outcome: PlaybackStepOutcome) {
    if (settled) {
      return;
    }

    settled = true;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    signal?.removeEventListener("abort", interrupt);
    media.release();

    resolve(outcome);
  }

  function interrupt() {
    finish({ status: "interrupted" });
  }

  function fail(error: unknown) {
    finish({
      status: "failed",
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  audio.onended = () => finish({ status: "completed" });
  audio.onerror = () =>
    fail(new Error(audio.error?.message || "Audio playback failed"));

  signal?.addEventListener("abort", interrupt, { once: true });
  try {
    void audio.play().catch(fail);
  } catch (error) {
    fail(error);
  }

  return promise;
}
