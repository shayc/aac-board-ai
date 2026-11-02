import { createPersistedStore } from "@shared/state/persisted-store";
import { parseClampedNumber } from "@shared/utils/parse-clamped-number";
import { useSyncExternalStore } from "react";

export interface AppearancePreferences {
  tileSaturation: number;
  areTileBordersVisible: boolean;
  tileLabelPlacement: TileLabelPlacement;
}

export const TILE_SATURATION = { min: 0, max: 1, fallback: 1 };
export type TileLabelPlacement = "top" | "bottom" | "hidden";

function isTileLabelPlacement(value: unknown): value is TileLabelPlacement {
  return value === "top" || value === "bottom" || value === "hidden";
}

export function parseAppearancePreferences(
  raw: unknown,
): AppearancePreferences {
  const stored = (raw ?? {}) as Record<string, unknown>;

  return {
    tileSaturation: parseClampedNumber(stored.tileSaturation, TILE_SATURATION),
    areTileBordersVisible:
      typeof stored.areTileBordersVisible === "boolean"
        ? stored.areTileBordersVisible
        : false,
    tileLabelPlacement: isTileLabelPlacement(stored.tileLabelPlacement)
      ? stored.tileLabelPlacement
      : "top",
  };
}

const appearancePreferencesStore = createPersistedStore<AppearancePreferences>(
  "appearance-preferences",
  parseAppearancePreferences,
);

export function setTileSaturation(tileSaturation: number): void {
  appearancePreferencesStore.setState({
    ...appearancePreferencesStore.getSnapshot(),
    tileSaturation,
  });
}

export function setTileBordersVisible(areTileBordersVisible: boolean): void {
  appearancePreferencesStore.setState({
    ...appearancePreferencesStore.getSnapshot(),
    areTileBordersVisible,
  });
}

export function setTileLabelPlacement(
  tileLabelPlacement: TileLabelPlacement,
): void {
  appearancePreferencesStore.setState({
    ...appearancePreferencesStore.getSnapshot(),
    tileLabelPlacement,
  });
}

export function useAppearancePreferences(): AppearancePreferences {
  return useSyncExternalStore(
    appearancePreferencesStore.subscribe,
    appearancePreferencesStore.getSnapshot,
  );
}
