interface PlayAudioOptions {
  signal?: AbortSignal;
}

export function playAudio(
  src: string,
  { signal }: PlayAudioOptions = {},
): Promise<void> {
  if (signal?.aborted) {
    return Promise.resolve();
  }

  const { promise, resolve } = Promise.withResolvers<void>();
  const audio = new Audio(src);
  let settled = false;

  function finish() {
    if (settled) {
      return;
    }

    settled = true;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    signal?.removeEventListener("abort", finish);

    resolve();
  }

  audio.onended = finish;
  audio.onerror = finish;

  signal?.addEventListener("abort", finish, { once: true });
  audio.play().catch(finish);

  return promise;
}
