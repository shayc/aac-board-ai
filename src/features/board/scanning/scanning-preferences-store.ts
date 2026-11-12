import { useExternalStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { isRecord } from "@shared/utils/is-record";
import { parseBoolean } from "@shared/utils/parse-boolean";
import {
  parseClampedNumber,
  type ClampedNumberOptions,
} from "@shared/utils/parse-clamped-number";

const SCAN_METHODS = ["auto", "step"] as const;

/** Auto uses one switch to select. Step uses separate move and select switches. */
export type ScanMethod = (typeof SCAN_METHODS)[number];

interface ScanningPreferences {
  isEnabled: boolean;
  method: ScanMethod;
  intervalMs: number;
}

export const SCAN_INTERVAL_MS: ClampedNumberOptions = {
  min: 500,
  max: 5000,
  defaultValue: 1200,
};

function isScanMethod(value: unknown): value is ScanMethod {
  return SCAN_METHODS.some((method) => method === value);
}

export function parseScanningPreferences(raw: unknown): ScanningPreferences {
  const stored: Record<string, unknown> = isRecord(raw) ? raw : {};

  return {
    isEnabled: parseBoolean(stored.isEnabled, false),
    method: isScanMethod(stored.method) ? stored.method : "auto",
    intervalMs: parseClampedNumber(stored.intervalMs, SCAN_INTERVAL_MS),
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

export function setScanIntervalMs(intervalMs: number): void {
  updatePreferences({ intervalMs });
}

export function useScanningPreferences(): ScanningPreferences {
  return useExternalStore(scanningPreferencesStore);
}
