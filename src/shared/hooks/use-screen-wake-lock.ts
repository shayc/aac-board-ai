import { useEffect } from "react";

/**
 * Keeps the screen on while the calling component is mounted, so a device
 * left on the table during a conversation does not dim and lock.
 */
export function useScreenWakeLock(): void {
  useEffect(keepScreenAwake, []);
}

function keepScreenAwake(): (() => void) | undefined {
  if (!("wakeLock" in navigator)) {
    return;
  }

  let heldLock: WakeLockSentinel | undefined;
  let isStopped = false;

  function isHoldingLock(): boolean {
    return heldLock !== undefined && !heldLock.released;
  }

  async function requestLock() {
    if (isHoldingLock()) {
      return;
    }

    let lock: WakeLockSentinel;
    try {
      lock = await navigator.wakeLock.request("screen");
    } catch {
      // The browser refuses while the page is hidden or the battery is low.
      // The screen then follows the device's auto-lock setting.
      return;
    }

    // An overlapping request can have settled first.
    if (isStopped || isHoldingLock()) {
      void lock.release();

      return;
    }

    heldLock = lock;
  }

  // The browser releases the lock whenever the page is hidden and never
  // restores it.
  function handleVisibilityChange() {
    if (document.visibilityState === "visible") {
      void requestLock();
    }
  }

  void requestLock();
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return () => {
    isStopped = true;
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    void heldLock?.release();
  };
}
