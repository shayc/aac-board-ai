import { useExternalStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { parseBoolean } from "@shared/utils/parse-boolean";
import {
  parseClampedNumber,
  type ClampedNumberOptions,
} from "@shared/utils/parse-clamped-number";
import type { SymbolLabelPlacement } from "../aac-symbol/aac-symbol";

export type TileLabelPlacement = SymbolLabelPlacement | "hidden";

interface TilePreferences {
  saturation: number;
  areBordersVisible: boolean;
  labelPlacement: TileLabelPlacement;
}

export const TILE_SATURATION: ClampedNumberOptions = {
  min: 0,
  max: 1,
  defaultValue: 1,
};

function isTileLabelPlacement(value: unknown): value is TileLabelPlacement {
  return value === "top" || value === "bottom" || value === "hidden";
}

export function parseTilePreferences(raw: unknown): TilePreferences {
  const stored = (raw ?? {}) as Record<string, unknown>;

  return {
    saturation: parseClampedNumber(stored.saturation, TILE_SATURATION),
    areBordersVisible: parseBoolean(stored.areBordersVisible, false),
    labelPlacement: isTileLabelPlacement(stored.labelPlacement)
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

export function setTileLabelPlacement(
  labelPlacement: TileLabelPlacement,
): void {
  updatePreferences({ labelPlacement });
}

export function useTilePreferences(): TilePreferences {
  return useExternalStore(tilePreferencesStore);
}
