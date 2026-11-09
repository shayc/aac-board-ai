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

  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const audio = new Audio(src);
  const settled = new AbortController();
  const listenerOptions = { signal: settled.signal };

  function release() {
    settled.abort();
    audio.pause();
  }

  function finish() {
    release();
    resolve();
  }

  function fail(cause: unknown) {
    release();
    reject(new Error("Audio failed to play", { cause }));
  }

  audio.addEventListener("ended", finish, listenerOptions);
  audio.addEventListener("error", () => fail(audio.error), listenerOptions);
  signal?.addEventListener("abort", finish, listenerOptions);
  audio.play().catch(fail);

  return promise;
}
