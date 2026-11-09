import { useExternalStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { isRecord } from "@shared/utils/is-record";
import { parseBoolean } from "@shared/utils/parse-boolean";
import {
  parseClampedNumber,
  type ClampedNumberOptions,
} from "@shared/utils/parse-clamped-number";
import type { SymbolLabelPlacement } from "../aac-symbol/aac-symbol";

const TILE_LABEL_PLACEMENTS = [
  "top",
  "bottom",
  "hidden",
] as const satisfies readonly (SymbolLabelPlacement | "hidden")[];

export type TileLabelPlacement = (typeof TILE_LABEL_PLACEMENTS)[number];

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
  return TILE_LABEL_PLACEMENTS.some((placement) => placement === value);
}

export function parseTilePreferences(raw: unknown): TilePreferences {
  const stored: Record<string, unknown> = isRecord(raw) ? raw : {};

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
