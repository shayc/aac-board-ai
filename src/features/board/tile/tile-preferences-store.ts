import { useExternalStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { parseBoolean } from "@shared/utils/parse-boolean";
import {
  parseClampedNumber,
  type ClampedNumberOptions,
} from "@shared/utils/parse-clamped-number";
import type { LabelPlacement } from "../aac-symbol/aac-symbol";

interface TilePreferences {
  saturation: number;
  areBordersVisible: boolean;
  labelPlacement: LabelPlacement;
}

export const TILE_SATURATION: ClampedNumberOptions = {
  min: 0,
  max: 1,
  defaultValue: 1,
};

function isLabelPlacement(value: unknown): value is LabelPlacement {
  return value === "top" || value === "bottom" || value === "hidden";
}

export function parseTilePreferences(raw: unknown): TilePreferences {
  const stored = (raw ?? {}) as Record<string, unknown>;

  return {
    saturation: parseClampedNumber(stored.saturation, TILE_SATURATION),
    areBordersVisible: parseBoolean(stored.areBordersVisible, false),
    labelPlacement: isLabelPlacement(stored.labelPlacement)
      ? stored.labelPlacement
      : "top",
  };
}

const tilePreferencesStore = createPersistedStore<TilePreferences>(
  "tile-preferences",
  parseTilePreferences,
);

function updatePreferences(patch: Partial<TilePreferences>): void {
  tilePreferencesStore.setState((preferences) => ({
    ...preferences,
    ...patch,
  }));
}

export function setTileSaturation(saturation: number): void {
  updatePreferences({ saturation });
}

export function setTileBordersVisible(areBordersVisible: boolean): void {
  updatePreferences({ areBordersVisible });
}

export function setTileLabelPlacement(labelPlacement: LabelPlacement): void {
  updatePreferences({ labelPlacement });
}

export function useTilePreferences(): TilePreferences {
  return useExternalStore(tilePreferencesStore);
}
