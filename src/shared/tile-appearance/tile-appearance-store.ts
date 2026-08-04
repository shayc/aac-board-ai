import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

interface TileAppearanceConfig {
  saturation: number;
  borderVisible: boolean;
}

export const TILE_SATURATION = { min: 0, max: 1, fallback: 1 };

export function parseTileAppearanceConfig(raw: unknown): TileAppearanceConfig {
  const parsed = (raw ?? {}) as Record<string, unknown>;
  const { min, max, fallback } = TILE_SATURATION;

  return {
    saturation:
      typeof parsed.saturation === "number" &&
      Number.isFinite(parsed.saturation)
        ? Math.min(Math.max(parsed.saturation, min), max)
        : fallback,
    borderVisible:
      typeof parsed.borderVisible === "boolean" ? parsed.borderVisible : false,
  };
}

const tileAppearanceStore = createPersistedStore<TileAppearanceConfig>(
  "tile-color-config",
  parseTileAppearanceConfig,
);

export function setTileSaturation(saturation: number): void {
  tileAppearanceStore.setState({
    ...tileAppearanceStore.getSnapshot(),
    saturation,
  });
}

export function setTileBorderVisible(borderVisible: boolean): void {
  tileAppearanceStore.setState({
    ...tileAppearanceStore.getSnapshot(),
    borderVisible,
  });
}

export function useTileAppearanceConfig(): TileAppearanceConfig {
  return useSyncExternalStore(
    tileAppearanceStore.subscribe,
    tileAppearanceStore.getSnapshot,
  );
}
