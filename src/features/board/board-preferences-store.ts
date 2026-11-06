import { createPersistedStore } from "@shared/state/persisted-store";
import {
  parseClampedNumber,
  type ClampedNumberOptions,
} from "@shared/utils/parse-clamped-number";
import { useSyncExternalStore } from "react";
import type { SymbolLabelPlacement } from "./aac-symbol/aac-symbol";

export interface BoardPreferences {
  tileSaturation: number;
  areTileBordersVisible: boolean;
  tileLabelPlacement: SymbolLabelPlacement;
}

export const TILE_SATURATION: ClampedNumberOptions = {
  min: 0,
  max: 1,
  defaultValue: 1,
};

function isSymbolLabelPlacement(value: unknown): value is SymbolLabelPlacement {
  return value === "top" || value === "bottom" || value === "hidden";
}

export function parseBoardPreferences(raw: unknown): BoardPreferences {
  const stored = (raw ?? {}) as Record<string, unknown>;

  return {
    tileSaturation: parseClampedNumber(stored.tileSaturation, TILE_SATURATION),
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

function updatePreferences(patch: Partial<BoardPreferences>): void {
  boardPreferencesStore.setState({
    ...boardPreferencesStore.getSnapshot(),
    ...patch,
  });
}

export function setTileSaturation(tileSaturation: number): void {
  updatePreferences({ tileSaturation });
}

export function setTileBordersVisible(areTileBordersVisible: boolean): void {
  updatePreferences({ areTileBordersVisible });
}

export function setTileLabelPlacement(
  tileLabelPlacement: SymbolLabelPlacement,
): void {
  updatePreferences({ tileLabelPlacement });
}

export function useBoardPreferences(): BoardPreferences {
  return useSyncExternalStore(
    boardPreferencesStore.subscribe,
    boardPreferencesStore.getSnapshot,
  );
}
