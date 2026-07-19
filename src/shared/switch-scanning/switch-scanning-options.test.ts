import { describe, expect, test } from "vitest";
import {
  createKeyboardBindings,
  createMouseBindings,
  createScanMethod,
  createSwitchDefinitions,
} from "./switch-scanning-options";
import type { SwitchScanningConfig } from "./switch-scanning-store";

const config: SwitchScanningConfig = {
  enabled: true,
  method: "auto",
  scanIntervalMs: 1_500,
  dwellDurationMs: 2_000,
  cyclesBeforePausing: 5,
  firstItemPauseMs: 600,
  ignoreRepeatMs: 400,
  minimumPressDurationMs: 200,
  inputs: {
    single: { kind: "keyboard", code: "F13", label: "F13" },
    next: { kind: "keyboard", code: "KeyN", label: "N" },
    select: { kind: "mouse", button: 3 },
  },
};

describe("switch-scanning-options", () => {
  test("builds each package scan method from the persisted timing profile", () => {
    expect(createScanMethod(config)).toMatchObject({
      kind: "auto",
      intervalMs: 1_500,
      passes: 5,
      firstItemPauseMs: 600,
    });
    expect(createScanMethod({ ...config, method: "step" })).toEqual({
      kind: "step",
      repeat: false,
    });
    expect(createScanMethod({ ...config, method: "dwell" })).toMatchObject({
      kind: "dwell",
      dwellDurationMs: 2_000,
    });
    expect(createScanMethod({ ...config, method: "inverse" })).toMatchObject({
      kind: "inverse",
      intervalMs: 1_500,
      passes: 5,
      firstItemPauseMs: 600,
    });
  });

  test("maps configured keyboard keys and mouse buttons to logical switches", () => {
    expect(createSwitchDefinitions(config)).toEqual({
      single: {
        action: "select",
        holdDurationMs: 200,
        ignoreRepeatMs: 400,
      },
    });
    expect(createKeyboardBindings(config)).toEqual({ F13: "single" });
    expect(createMouseBindings(config)).toEqual({});

    const stepConfig = { ...config, method: "step" as const };

    expect(createSwitchDefinitions(stepConfig)).toEqual({
      next: {
        action: "next",
        holdDurationMs: 200,
        ignoreRepeatMs: 400,
      },
      select: {
        action: "select",
        holdDurationMs: 200,
        ignoreRepeatMs: 400,
      },
    });
    expect(createKeyboardBindings(stepConfig)).toEqual({ KeyN: "next" });
    expect(createMouseBindings(stepConfig)).toEqual({ 3: "select" });

    expect(createSwitchDefinitions({ ...config, method: "dwell" })).toEqual({
      single: {
        action: "next",
        holdDurationMs: 200,
        ignoreRepeatMs: 400,
      },
    });
    expect(createSwitchDefinitions({ ...config, method: "inverse" })).toEqual({
      single: {
        action: "scan",
        holdDurationMs: 200,
        ignoreRepeatMs: 400,
      },
    });
  });
});
