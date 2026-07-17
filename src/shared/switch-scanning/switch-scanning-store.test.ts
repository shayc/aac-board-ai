import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  DWELL_DURATION_MS,
  parseSwitchScanningConfig,
  SCAN_INTERVAL_MS,
  setDwellDurationMs,
  setScanIntervalMs,
  setSwitchScanningEnabled,
  setSwitchScanningMethod,
  useSwitchScanningConfig,
} from "./switch-scanning-store";

describe("switch-scanning-store", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("parseSwitchScanningConfig", () => {
    test("uses an opt-in automatic scan profile by default", () => {
      expect(parseSwitchScanningConfig(undefined)).toEqual({
        enabled: false,
        method: "auto",
        scanIntervalMs: SCAN_INTERVAL_MS.fallback,
        dwellDurationMs: DWELL_DURATION_MS.fallback,
      });
    });

    test("keeps valid persisted settings", () => {
      expect(
        parseSwitchScanningConfig({
          enabled: true,
          method: "dwell",
          scanIntervalMs: 2_400,
          dwellDurationMs: 1_800,
        }),
      ).toEqual({
        enabled: true,
        method: "dwell",
        scanIntervalMs: 2_400,
        dwellDurationMs: 1_800,
      });
    });

    test("repairs unknown methods and unsafe timing values", () => {
      expect(
        parseSwitchScanningConfig({
          method: "unknown",
          scanIntervalMs: -1,
          dwellDurationMs: Number.POSITIVE_INFINITY,
        }),
      ).toEqual({
        enabled: false,
        method: "auto",
        scanIntervalMs: SCAN_INTERVAL_MS.min,
        dwellDurationMs: DWELL_DURATION_MS.fallback,
      });
    });
  });

  test("setters update and persist one complete profile", async () => {
    const { result, rerender } = await renderHook(() =>
      useSwitchScanningConfig(),
    );

    setSwitchScanningEnabled(true);
    setSwitchScanningMethod("inverse");
    setScanIntervalMs(2_000);
    setDwellDurationMs(1_500);
    await rerender();

    expect(result.current).toEqual({
      enabled: true,
      method: "inverse",
      scanIntervalMs: 2_000,
      dwellDurationMs: 1_500,
    });
    await vi.waitFor(() =>
      expect(localStorage.getItem("switch-scanning-config")).toBe(
        JSON.stringify(result.current),
      ),
    );
  });
});
