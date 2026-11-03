import { createPersistedStore } from "@shared/state/persisted-store";
import { parseClampedNumber } from "@shared/utils/parse-clamped-number";
import { useSyncExternalStore } from "react";
import type { SymbolLabelPlacement } from "./board-types";

export interface BoardPreferences {
  tileSaturation: number;
  tileBrightness: number;
  areTileBordersVisible: boolean;
  tileLabelPlacement: SymbolLabelPlacement;
}

export const TILE_SATURATION = { min: 0, max: 1, fallback: 1 };
export const TILE_BRIGHTNESS = { min: 0.5, max: 1, fallback: 1 };

function isSymbolLabelPlacement(value: unknown): value is SymbolLabelPlacement {
  return value === "top" || value === "bottom" || value === "hidden";
}

export function parseBoardPreferences(raw: unknown): BoardPreferences {
  const stored = (raw ?? {}) as Record<string, unknown>;

  return {
    tileSaturation: parseClampedNumber(stored.tileSaturation, TILE_SATURATION),
    tileBrightness: parseClampedNumber(stored.tileBrightness, TILE_BRIGHTNESS),
    areTileBordersVisible:
      typeof stored.areTileBordersVisible === "boolean"
        ? stored.areTileBordersVisible
        : false,
    tileLabelPlacement: isSymbolLabelPlacement(stored.tileLabelPlacement)
      ? stored.tileLabelPlacement
      : "top",
  };
}

const boardPreferencesStore = createPersistedStore<BoardPreferences>(
  "board-preferences",
  parseBoardPreferences,
);

export function setTileSaturation(tileSaturation: number): void {
  boardPreferencesStore.setState({
    ...boardPreferencesStore.getSnapshot(),
    tileSaturation,
  });
}

export function setTileBrightness(tileBrightness: number): void {
  boardPreferencesStore.setState({
    ...boardPreferencesStore.getSnapshot(),
    tileBrightness,
  });
}

export function setTileBordersVisible(areTileBordersVisible: boolean): void {
  boardPreferencesStore.setState({
    ...boardPreferencesStore.getSnapshot(),
    areTileBordersVisible,
  });
}

export function setTileLabelPlacement(
  tileLabelPlacement: SymbolLabelPlacement,
): void {
  boardPreferencesStore.setState({
    ...boardPreferencesStore.getSnapshot(),
    tileLabelPlacement,
  });
}

export function useBoardPreferences(): BoardPreferences {
  return useSyncExternalStore(
    boardPreferencesStore.subscribe,
    boardPreferencesStore.getSnapshot,
  );
}
