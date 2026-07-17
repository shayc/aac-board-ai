import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

export const SWITCH_SCANNING_METHODS = [
  "auto",
  "step",
  "dwell",
  "inverse",
] as const;

export type SwitchScanningMethod = (typeof SWITCH_SCANNING_METHODS)[number];

export interface SwitchScanningConfig {
  enabled: boolean;
  method: SwitchScanningMethod;
  scanIntervalMs: number;
  dwellDurationMs: number;
}

interface TimingRange {
  min: number;
  max: number;
  fallback: number;
}

export const SCAN_INTERVAL_MS = {
  min: 200,
  max: 12_000,
  fallback: 1_200,
} as const;

export const DWELL_DURATION_MS = {
  min: 200,
  max: 10_000,
  fallback: 1_000,
} as const;

function isSwitchScanningMethod(value: unknown): value is SwitchScanningMethod {
  return SWITCH_SCANNING_METHODS.some((method) => method === value);
}

function parseTiming(value: unknown, range: TimingRange): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return range.fallback;
  }

  return Math.min(Math.max(value, range.min), range.max);
}

export function parseSwitchScanningConfig(raw: unknown): SwitchScanningConfig {
  const parsed = (raw ?? {}) as Record<string, unknown>;

  return {
    enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : false,
    method: isSwitchScanningMethod(parsed.method) ? parsed.method : "auto",
    scanIntervalMs: parseTiming(parsed.scanIntervalMs, SCAN_INTERVAL_MS),
    dwellDurationMs: parseTiming(parsed.dwellDurationMs, DWELL_DURATION_MS),
  };
}

const switchScanningStore = createPersistedStore<SwitchScanningConfig>(
  "switch-scanning-config",
  parseSwitchScanningConfig,
);

function updateSwitchScanningConfig(
  update: Partial<SwitchScanningConfig>,
): void {
  switchScanningStore.setState({
    ...switchScanningStore.getSnapshot(),
    ...update,
  });
}

export function setSwitchScanningEnabled(enabled: boolean): void {
  updateSwitchScanningConfig({ enabled });
}

export function setSwitchScanningMethod(method: SwitchScanningMethod): void {
  updateSwitchScanningConfig({ method });
}

export function setScanIntervalMs(scanIntervalMs: number): void {
  updateSwitchScanningConfig({
    scanIntervalMs: parseTiming(scanIntervalMs, SCAN_INTERVAL_MS),
  });
}

export function setDwellDurationMs(dwellDurationMs: number): void {
  updateSwitchScanningConfig({
    dwellDurationMs: parseTiming(dwellDurationMs, DWELL_DURATION_MS),
  });
}

export function useSwitchScanningConfig(): SwitchScanningConfig {
  return useSyncExternalStore(
    switchScanningStore.subscribe,
    switchScanningStore.getSnapshot,
  );
}
