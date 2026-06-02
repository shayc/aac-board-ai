export interface PlayAudioOptions {
  signal?: AbortSignal;
}

let stopCurrent: (() => void) | null = null;

export function playAudio(
  url: string,
  { signal }: PlayAudioOptions = {},
): Promise<void> {
  if (signal?.aborted) {
    return Promise.resolve();
  }

  stopCurrent?.();

  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const audio = new Audio(url);
  let settled = false;

  function finish(outcome: () => void) {
    if (settled) {
      return;
    }

    settled = true;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    signal?.removeEventListener("abort", stop);

    if (stopCurrent === stop) {
      stopCurrent = null;
    }

    outcome();
  }

  function stop() {
    finish(resolve);
  }

  audio.onended = () => finish(resolve);
  audio.onerror = () => {
    finish(() =>
      reject(new Error(audio.error?.message ?? "audio playback failed")),
    );
  };

  signal?.addEventListener("abort", stop, { once: true });
  stopCurrent = stop;

  audio.play().catch((error: unknown) => {
    finish(() =>
      reject(error instanceof Error ? error : new Error(String(error))),
    );
  });

  return promise;
}
