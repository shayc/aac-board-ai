import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

export const SWITCH_SCANNING_METHODS = [
  "auto",
  "step",
  "dwell",
  "inverse",
] as const;

export type SwitchScanningMethod = (typeof SWITCH_SCANNING_METHODS)[number];

export type SwitchInputRole = "single" | "next" | "select";

export type SwitchInput =
  | {
      kind: "keyboard";
      code: string;
      label: string;
    }
  | {
      kind: "mouse";
      button: number;
    };

export interface SwitchInputAssignments {
  single: SwitchInput;
  next: SwitchInput;
  select: SwitchInput;
}

export interface SwitchScanningConfig {
  enabled: boolean;
  method: SwitchScanningMethod;
  scanIntervalMs: number;
  dwellDurationMs: number;
  inputs: SwitchInputAssignments;
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

const DEFAULT_INPUTS: SwitchInputAssignments = {
  single: { kind: "keyboard", code: "Space", label: "Space" },
  next: { kind: "keyboard", code: "Space", label: "Space" },
  select: { kind: "keyboard", code: "Enter", label: "Enter" },
};

function isSwitchScanningMethod(value: unknown): value is SwitchScanningMethod {
  return SWITCH_SCANNING_METHODS.some((method) => method === value);
}

function parseTiming(value: unknown, range: TimingRange): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return range.fallback;
  }

  return Math.min(Math.max(value, range.min), range.max);
}

function parseSwitchInput(value: unknown): SwitchInput | null {
  const parsed = (value ?? {}) as Record<string, unknown>;

  if (
    parsed.kind === "keyboard" &&
    typeof parsed.code === "string" &&
    parsed.code.length > 0 &&
    typeof parsed.label === "string" &&
    parsed.label.length > 0
  ) {
    return {
      kind: "keyboard",
      code: parsed.code,
      label: parsed.label,
    };
  }

  if (
    parsed.kind === "mouse" &&
    typeof parsed.button === "number" &&
    Number.isInteger(parsed.button) &&
    parsed.button >= 0 &&
    parsed.button <= 15
  ) {
    return { kind: "mouse", button: parsed.button };
  }

  return null;
}

function getSwitchInputId(input: SwitchInput): string {
  return input.kind === "keyboard"
    ? `keyboard:${input.code}`
    : `mouse:${input.button}`;
}

function parseSwitchInputAssignment(
  value: unknown,
  fallback: SwitchInput,
): SwitchInput {
  const legacyInput = Array.isArray(value) ? (value as unknown[])[0] : value;

  return parseSwitchInput(legacyInput) ?? fallback;
}

function parseSwitchInputAssignments(value: unknown): SwitchInputAssignments {
  const parsed = (value ?? {}) as Record<string, unknown>;

  return {
    single: parseSwitchInputAssignment(parsed.single, DEFAULT_INPUTS.single),
    next: parseSwitchInputAssignment(parsed.next, DEFAULT_INPUTS.next),
    select: parseSwitchInputAssignment(parsed.select, DEFAULT_INPUTS.select),
  };
}

export function parseSwitchScanningConfig(raw: unknown): SwitchScanningConfig {
  const parsed = (raw ?? {}) as Record<string, unknown>;

  return {
    enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : false,
    method: isSwitchScanningMethod(parsed.method) ? parsed.method : "auto",
    scanIntervalMs: parseTiming(parsed.scanIntervalMs, SCAN_INTERVAL_MS),
    dwellDurationMs: parseTiming(parsed.dwellDurationMs, DWELL_DURATION_MS),
    inputs: parseSwitchInputAssignments(parsed.inputs),
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

export function setSwitchInput(
  role: SwitchInputRole,
  input: SwitchInput,
): void {
  const config = switchScanningStore.getSnapshot();
  const inputs: SwitchInputAssignments = {
    ...config.inputs,
    [role]: input,
  };

  if (
    role === "next" &&
    getSwitchInputId(config.inputs.select) === getSwitchInputId(input)
  ) {
    inputs.select = config.inputs.next;
  }

  if (
    role === "select" &&
    getSwitchInputId(config.inputs.next) === getSwitchInputId(input)
  ) {
    inputs.next = config.inputs.select;
  }

  updateSwitchScanningConfig({ inputs });
}

export function useSwitchScanningConfig(): SwitchScanningConfig {
  return useSyncExternalStore(
    switchScanningStore.subscribe,
    switchScanningStore.getSnapshot,
  );
}
