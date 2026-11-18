import { type Mock, onTestFinished, vi } from "vitest";

interface WakeLockStub {
  request: Mock<WakeLock["request"]>;
  /** Every lock granted so far, oldest first. */
  locks: WakeLockSentinel[];
}

export function stubWakeLock(): WakeLockStub {
  const locks: WakeLockSentinel[] = [];
  const request = vi.fn<WakeLock["request"]>(() =>
    Promise.resolve(grantLock(locks)),
  );

  Object.defineProperty(navigator, "wakeLock", {
    configurable: true,
    value: { request },
  });
  onTestFinished(() => {
    Reflect.deleteProperty(navigator, "wakeLock");
  });

  return { request, locks };
}

export function refuseNextWakeLock(request: Mock<WakeLock["request"]>): void {
  request.mockRejectedValueOnce(new DOMException("Refused", "NotAllowedError"));
}

/** Leaves the next request pending until the returned function is called. */
export function deferNextWakeLock({
  request,
  locks,
}: WakeLockStub): () => void {
  const { promise, resolve } = Promise.withResolvers<WakeLockSentinel>();
  request.mockReturnValueOnce(promise);

  return () => resolve(grantLock(locks));
}

function grantLock(locks: WakeLockSentinel[]): WakeLockSentinel {
  const lock = new StubWakeLockSentinel();
  locks.push(lock);

  return lock;
}

class StubWakeLockSentinel extends EventTarget implements WakeLockSentinel {
  readonly type = "screen";
  released = false;
  onrelease: WakeLockSentinel["onrelease"] = null;

  release(): Promise<void> {
    this.released = true;
    this.dispatchEvent(new Event("release"));

    return Promise.resolve();
  }
}
