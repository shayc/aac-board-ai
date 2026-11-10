import { useExternalStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { isRecord } from "@shared/utils/is-record";
import { parseBoolean } from "@shared/utils/parse-boolean";
import {
  parseClampedNumber,
  type ClampedNumberOptions,
} from "@shared/utils/parse-clamped-number";
import type { ScanMethod } from "./scan-model";

const SCAN_METHODS = ["auto", "step"] as const satisfies readonly ScanMethod[];
const SCAN_PATTERNS = ["row-column", "linear"] as const;

export type ScanPattern = (typeof SCAN_PATTERNS)[number];

export interface ScanningPreferences {
  isEnabled: boolean;
  method: ScanMethod;
  pattern: ScanPattern;
  /** Seconds each highlight stays in auto scan. */
  scanTime: number;
  /** Seconds added to the scan time on the first step of a pass. */
  firstItemDelay: number;
  scanCount: number;
  /** Seconds after a press during which further presses are ignored; 0 is off. */
  repeatPressDelay: number;
}

export const SCAN_TIME: ClampedNumberOptions = {
  min: 0.25,
  max: 5,
  defaultValue: 1.5,
};

export const FIRST_ITEM_DELAY: ClampedNumberOptions = {
  min: 0,
  max: 3,
  defaultValue: 0.5,
};

export const SCAN_COUNT: ClampedNumberOptions = {
  min: 1,
  max: 5,
  defaultValue: 3,
};

export const REPEAT_PRESS_DELAY: ClampedNumberOptions = {
  min: 0,
  max: 2,
  defaultValue: 0,
};

function isScanMethod(value: unknown): value is ScanMethod {
  return SCAN_METHODS.some((method) => method === value);
}

function isScanPattern(value: unknown): value is ScanPattern {
  return SCAN_PATTERNS.some((pattern) => pattern === value);
}

export function parseScanningPreferences(raw: unknown): ScanningPreferences {
  const stored: Record<string, unknown> = isRecord(raw) ? raw : {};

  return {
    isEnabled: parseBoolean(stored.isEnabled, false),
    method: isScanMethod(stored.method) ? stored.method : "auto",
    pattern: isScanPattern(stored.pattern) ? stored.pattern : "row-column",
    scanTime: parseClampedNumber(stored.scanTime, SCAN_TIME),
    firstItemDelay: parseClampedNumber(stored.firstItemDelay, FIRST_ITEM_DELAY),
    scanCount: Math.round(parseClampedNumber(stored.scanCount, SCAN_COUNT)),
    repeatPressDelay: parseClampedNumber(
      stored.repeatPressDelay,
      REPEAT_PRESS_DELAY,
    ),
  };
}

const scanningPreferencesStore = createPersistedStore<ScanningPreferences>(
  "scanning-preferences",
  parseScanningPreferences,
);

function updatePreferences(patch: Partial<ScanningPreferences>): void {
  scanningPreferencesStore.setState((preferences) => ({
    ...preferences,
    ...patch,
  }));
}

export function setScanningEnabled(isEnabled: boolean): void {
  updatePreferences({ isEnabled });
}

export function setScanMethod(method: ScanMethod): void {
  updatePreferences({ method });
}

export function setScanPattern(pattern: ScanPattern): void {
  updatePreferences({ pattern });
}

export function setScanTime(scanTime: number): void {
  updatePreferences({ scanTime });
}

export function setFirstItemDelay(firstItemDelay: number): void {
  updatePreferences({ firstItemDelay });
}

export function setScanCount(scanCount: number): void {
  updatePreferences({ scanCount });
}

export function setRepeatPressDelay(repeatPressDelay: number): void {
  updatePreferences({ repeatPressDelay });
}

export function useScanningPreferences(): ScanningPreferences {
  return useExternalStore(scanningPreferencesStore);
}
