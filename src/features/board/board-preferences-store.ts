import { useStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import { parseBoolean } from "@shared/utils/parse-boolean";
import {
  parseClampedNumber,
  type ClampedNumberOptions,
} from "@shared/utils/parse-clamped-number";
import type { SymbolLabelPlacement } from "./aac-symbol/aac-symbol";

export type TileLabelPlacement = SymbolLabelPlacement | "hidden";

export interface BoardPreferences {
  tileSaturation: number;
  areTileBordersVisible: boolean;
  tileLabelPlacement: TileLabelPlacement;
}

export const TILE_SATURATION: ClampedNumberOptions = {
  min: 0,
  max: 1,
  defaultValue: 1,
};

function isTileLabelPlacement(value: unknown): value is TileLabelPlacement {
  return value === "top" || value === "bottom" || value === "hidden";
}

export function parseBoardPreferences(raw: unknown): BoardPreferences {
  const stored = (raw ?? {}) as Record<string, unknown>;

  return {
    tileSaturation: parseClampedNumber(stored.tileSaturation, TILE_SATURATION),
    areTileBordersVisible: parseBoolean(stored.areTileBordersVisible, false),
    tileLabelPlacement: isTileLabelPlacement(stored.tileLabelPlacement)
      ? stored.tileLabelPlacement
      : "top",
  };
}

const boardPreferencesStore = createPersistedStore<BoardPreferences>(
  "board-preferences",
  parseBoardPreferences,
);

function updatePreferences(patch: Partial<BoardPreferences>): void {
  boardPreferencesStore.setState((preferences) => ({
    ...preferences,
    ...patch,
  }));
}

export function setTileSaturation(tileSaturation: number): void {
  updatePreferences({ tileSaturation });
}

export function setTileBordersVisible(areTileBordersVisible: boolean): void {
  updatePreferences({ areTileBordersVisible });
}

export function setTileLabelPlacement(
  tileLabelPlacement: TileLabelPlacement,
): void {
  updatePreferences({ tileLabelPlacement });
}

export function useBoardPreferences(): BoardPreferences {
  return useStore(boardPreferencesStore);
}
