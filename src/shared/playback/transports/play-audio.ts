import type { PlaybackOutcome } from "../playback-context";

interface PlayAudioOptions {
  signal?: AbortSignal;
}

export function playAudio(
  src: string,
  { signal }: PlayAudioOptions = {},
): Promise<PlaybackOutcome> {
  if (signal?.aborted) {
    return Promise.resolve("interrupted");
  }

  const { promise, resolve } = Promise.withResolvers<PlaybackOutcome>();
  const audio = new Audio(src);
  let settled = false;

  const onAbort = () => finish("interrupted");

  function finish(outcome: PlaybackOutcome) {
    if (settled) {
      return;
    }

    settled = true;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    signal?.removeEventListener("abort", onAbort);

    resolve(outcome);
  }

  audio.onended = () => finish("completed");
  audio.onerror = () => finish("failed");

  signal?.addEventListener("abort", onAbort, { once: true });
  try {
    void audio.play().catch(() => finish("failed"));
  } catch {
    finish("failed");
  }

  return promise;
}
