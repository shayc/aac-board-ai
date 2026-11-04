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
  const settled = new AbortController();
  const listenerOptions = { signal: settled.signal };

  function finish() {
    settled.abort();
    audio.pause();
    resolve();
  }

  audio.addEventListener("ended", finish, listenerOptions);
  audio.addEventListener("error", finish, listenerOptions);
  signal?.addEventListener("abort", finish, listenerOptions);
  audio.play().catch(finish);

  return promise;
}
