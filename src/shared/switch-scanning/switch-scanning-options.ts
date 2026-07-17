import {
  autoScan,
  dwellScan,
  inverseScan,
  stepScan,
  type KeyboardActionBindings,
  type ScanMethod,
} from "@shayc/switch-scanning/react";
import type {
  SwitchScanningConfig,
  SwitchScanningMethod,
} from "./switch-scanning-store";

const TIMED_SCAN_PASSES = 3;

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

export function createKeyboardBindings(
  method: SwitchScanningMethod,
): KeyboardActionBindings {
  switch (method) {
    case "auto":
      return { Space: "select", Enter: "select", NumpadEnter: "select" };
    case "step":
      return { Space: "next", Enter: "select", NumpadEnter: "select" };
    case "dwell":
      return { Space: "next", Enter: "next", NumpadEnter: "next" };
    case "inverse":
      return { Space: "scan", Enter: "scan", NumpadEnter: "scan" };
  }
}
