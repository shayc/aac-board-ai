import {
  autoScan,
  dwellScan,
  inverseScan,
  stepScan,
  type ScanMethod,
  type SwitchAction,
  type SwitchDefinition,
} from "@shayc/switch-scanning/react";
import type { SwitchScanningConfig } from "./switch-scanning-store";

const TIMED_SCAN_PASSES = 3;
const SINGLE_SWITCH_ID = "single";
const NEXT_SWITCH_ID = "next";
const SELECT_SWITCH_ID = "select";

type MouseSwitchBindings = Readonly<Record<number, string>>;

export function createScanMethod(config: SwitchScanningConfig): ScanMethod {
  switch (config.method) {
    case "auto":
      return autoScan({
        intervalMs: config.scanIntervalMs,
        passes: TIMED_SCAN_PASSES,
      });
    case "step":
      return stepScan();
    case "dwell":
      return dwellScan({ dwellDurationMs: config.dwellDurationMs });
    case "inverse":
      return inverseScan({
        intervalMs: config.scanIntervalMs,
        passes: TIMED_SCAN_PASSES,
      });
  }
}

function getSingleSwitchAction(config: SwitchScanningConfig): SwitchAction {
  switch (config.method) {
    case "auto":
      return "select";
    case "dwell":
      return "next";
    case "inverse":
      return "scan";
    case "step":
      return "next";
  }
}

function getInputBindings(config: SwitchScanningConfig) {
  if (config.method === "step") {
    return [
      { input: config.inputs.next, switchId: NEXT_SWITCH_ID },
      { input: config.inputs.select, switchId: SELECT_SWITCH_ID },
    ] as const;
  }

  return [{ input: config.inputs.single, switchId: SINGLE_SWITCH_ID }] as const;
}

export function createSwitchDefinitions(
  config: SwitchScanningConfig,
): Readonly<Record<string, SwitchDefinition>> {
  if (config.method === "step") {
    return {
      [NEXT_SWITCH_ID]: { action: "next" },
      [SELECT_SWITCH_ID]: { action: "select" },
    };
  }

  return {
    [SINGLE_SWITCH_ID]: { action: getSingleSwitchAction(config) },
  };
}

export function createKeyboardBindings(
  config: SwitchScanningConfig,
): Readonly<Record<string, string>> {
  const bindings: Record<string, string> = {};

  for (const { input, switchId } of getInputBindings(config)) {
    if (input.kind === "keyboard") {
      bindings[input.code] = switchId;
    }
  }

  return bindings;
}

export function createMouseBindings(
  config: SwitchScanningConfig,
): MouseSwitchBindings {
  const bindings: Record<number, string> = {};

  for (const { input, switchId } of getInputBindings(config)) {
    if (input.kind === "mouse") {
      bindings[input.button] = switchId;
    }
  }

  return bindings;
}
