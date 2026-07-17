import { describe, expect, test } from "vitest";
import {
  createKeyboardBindings,
  createScanMethod,
} from "./switch-scanning-options";
import type { SwitchScanningConfig } from "./switch-scanning-store";

const config: SwitchScanningConfig = {
  enabled: true,
  method: "auto",
  scanIntervalMs: 1_500,
  dwellDurationMs: 2_000,
};

describe("switch-scanning-options", () => {
  test("builds each package scan method from the persisted timing profile", () => {
    expect(createScanMethod(config)).toMatchObject({
      kind: "auto",
      intervalMs: 1_500,
      passes: 3,
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
      passes: 3,
    });
  });

  test("maps common switch-interface keys to each method's actions", () => {
    expect(createKeyboardBindings("auto")).toMatchObject({
      Space: "select",
      Enter: "select",
    });
    expect(createKeyboardBindings("step")).toMatchObject({
      Space: "next",
      Enter: "select",
    });
    expect(createKeyboardBindings("dwell")).toMatchObject({
      Space: "next",
      Enter: "next",
    });
    expect(createKeyboardBindings("inverse")).toMatchObject({
      Space: "scan",
      Enter: "scan",
    });
  });
});
