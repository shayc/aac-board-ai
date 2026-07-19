import { beforeEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import {
  CYCLES_BEFORE_PAUSING,
  DWELL_DURATION_MS,
  FIRST_ITEM_PAUSE_MS,
  IGNORE_REPEAT_MS,
  MINIMUM_PRESS_DURATION_MS,
  parseSwitchScanningConfig,
  SCAN_INTERVAL_MS,
  setCyclesBeforePausing,
  setDwellDurationMs,
  setFirstItemPauseMs,
  setIgnoreRepeatMs,
  setMinimumPressDurationMs,
  setScanIntervalMs,
  setSwitchScanningEnabled,
  setSwitchInput,
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
        cyclesBeforePausing: CYCLES_BEFORE_PAUSING.fallback,
        firstItemPauseMs: FIRST_ITEM_PAUSE_MS.fallback,
        ignoreRepeatMs: IGNORE_REPEAT_MS.fallback,
        minimumPressDurationMs: MINIMUM_PRESS_DURATION_MS.fallback,
        inputs: {
          single: { kind: "keyboard", code: "Space", label: "Space" },
          next: { kind: "keyboard", code: "Space", label: "Space" },
          select: { kind: "keyboard", code: "Enter", label: "Enter" },
        },
      });
    });

    test("keeps valid persisted settings", () => {
      expect(
        parseSwitchScanningConfig({
          enabled: true,
          method: "dwell",
          scanIntervalMs: 2_400,
          dwellDurationMs: 1_800,
          cyclesBeforePausing: 5,
          firstItemPauseMs: 600,
          ignoreRepeatMs: 400,
          minimumPressDurationMs: 200,
          inputs: {
            single: { kind: "mouse", button: 0 },
            next: { kind: "keyboard", code: "F13", label: "F13" },
            select: { kind: "mouse", button: 2 },
          },
        }),
      ).toEqual({
        enabled: true,
        method: "dwell",
        scanIntervalMs: 2_400,
        dwellDurationMs: 1_800,
        cyclesBeforePausing: 5,
        firstItemPauseMs: 600,
        ignoreRepeatMs: 400,
        minimumPressDurationMs: 200,
        inputs: {
          single: { kind: "mouse", button: 0 },
          next: { kind: "keyboard", code: "F13", label: "F13" },
          select: { kind: "mouse", button: 2 },
        },
      });
    });

    test("migrates legacy multiple-input assignments to one input", () => {
      const config = parseSwitchScanningConfig({
        inputs: {
          single: [
            { kind: "keyboard", code: "Space", label: "Space" },
            { kind: "keyboard", code: "Enter", label: "Enter" },
          ],
          next: [{ kind: "mouse", button: 3 }],
          select: [{ kind: "keyboard", code: "F13", label: "F13" }],
        },
      });

      expect(config.inputs).toEqual({
        single: { kind: "keyboard", code: "Space", label: "Space" },
        next: { kind: "mouse", button: 3 },
        select: { kind: "keyboard", code: "F13", label: "F13" },
      });
    });

    test("repairs unknown methods and unsafe timing values", () => {
      const { inputs, ...config } = parseSwitchScanningConfig({
        method: "unknown",
        scanIntervalMs: -1,
        dwellDurationMs: Number.POSITIVE_INFINITY,
        cyclesBeforePausing: 2.5,
        firstItemPauseMs: -1,
        ignoreRepeatMs: Number.POSITIVE_INFINITY,
        minimumPressDurationMs: 9_000,
      });

      expect(config).toEqual({
        enabled: false,
        method: "auto",
        scanIntervalMs: SCAN_INTERVAL_MS.min,
        dwellDurationMs: DWELL_DURATION_MS.fallback,
        cyclesBeforePausing: CYCLES_BEFORE_PAUSING.fallback,
        firstItemPauseMs: FIRST_ITEM_PAUSE_MS.min,
        ignoreRepeatMs: IGNORE_REPEAT_MS.fallback,
        minimumPressDurationMs: MINIMUM_PRESS_DURATION_MS.max,
      });
      expect(inputs.single).toEqual({
        kind: "keyboard",
        code: "Space",
        label: "Space",
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
    setCyclesBeforePausing(4);
    setFirstItemPauseMs(500);
    setIgnoreRepeatMs(300);
    setMinimumPressDurationMs(100);
    setSwitchInput("single", { kind: "mouse", button: 3 });
    await rerender();

    const { inputs, ...config } = result.current;

    expect(config).toEqual({
      enabled: true,
      method: "inverse",
      scanIntervalMs: 2_000,
      dwellDurationMs: 1_500,
      cyclesBeforePausing: 4,
      firstItemPauseMs: 500,
      ignoreRepeatMs: 300,
      minimumPressDurationMs: 100,
    });
    expect(inputs.single).toEqual({ kind: "mouse", button: 3 });
    await vi.waitFor(() =>
      expect(localStorage.getItem("switch-scanning-config")).toBe(
        JSON.stringify(result.current),
      ),
    );
  });

  test("swaps two-switch inputs instead of assigning one input twice", async () => {
    const { result, rerender } = await renderHook(() =>
      useSwitchScanningConfig(),
    );

    setSwitchInput("next", {
      kind: "keyboard",
      code: "Enter",
      label: "Enter",
    });
    await rerender();

    expect(result.current.inputs.next).toEqual({
      kind: "keyboard",
      code: "Enter",
      label: "Enter",
    });
    expect(result.current.inputs.select).toEqual({
      kind: "keyboard",
      code: "Space",
      label: "Space",
    });
  });
});
