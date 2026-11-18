import {
  deferNextWakeLock,
  refuseNextWakeLock,
  stubWakeLock,
} from "@shared/testing/stub-wake-lock";
import { describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useScreenWakeLock } from "./use-screen-wake-lock";

function showPageAgain() {
  document.dispatchEvent(new Event("visibilitychange"));
}

describe("useScreenWakeLock", () => {
  test("holds a screen lock while mounted and releases it on unmount", async () => {
    const { request, locks } = stubWakeLock();

    const { unmount } = await renderHook(() => useScreenWakeLock());

    await vi.waitFor(() => expect(locks).toHaveLength(1));
    expect(request).toHaveBeenCalledWith("screen");
    expect(locks[0]?.released).toBe(false);

    await unmount();

    expect(locks[0]?.released).toBe(true);
  });

  test("takes a new lock when the page is shown after the browser released it", async () => {
    const { locks } = stubWakeLock();
    await renderHook(() => useScreenWakeLock());
    await vi.waitFor(() => expect(locks).toHaveLength(1));

    await locks[0]?.release();
    showPageAgain();

    await vi.waitFor(() => expect(locks).toHaveLength(2));
    expect(locks[1]?.released).toBe(false);
  });

  test("keeps the lock it holds when the page is shown again", async () => {
    const { request, locks } = stubWakeLock();
    await renderHook(() => useScreenWakeLock());
    await vi.waitFor(() => expect(locks).toHaveLength(1));

    showPageAgain();

    expect(request).toHaveBeenCalledTimes(1);
  });

  test("leaves no lock behind when it unmounts before the request settles", async () => {
    const wakeLock = stubWakeLock();
    const grantLock = deferNextWakeLock(wakeLock);
    const { unmount } = await renderHook(() => useScreenWakeLock());

    await unmount();
    grantLock();

    await vi.waitFor(() => expect(wakeLock.locks[0]?.released).toBe(true));
  });

  test("tries again on the next showing after the browser refuses", async () => {
    const { request, locks } = stubWakeLock();
    refuseNextWakeLock(request);
    await renderHook(() => useScreenWakeLock());
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));

    showPageAgain();

    await vi.waitFor(() => expect(locks).toHaveLength(1));
  });
});
