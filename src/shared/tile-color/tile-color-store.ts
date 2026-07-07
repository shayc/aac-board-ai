import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

export interface TileColorConfig {
  saturation: number;
}

export const TILE_SATURATION = { min: 0, max: 1, fallback: 1 };

export function parseTileColorConfig(raw: unknown): TileColorConfig {
  const parsed = (raw ?? {}) as Record<string, unknown>;
  const { min, max, fallback } = TILE_SATURATION;

  return {
    saturation:
      typeof parsed.saturation === "number" &&
      Number.isFinite(parsed.saturation)
        ? Math.min(Math.max(parsed.saturation, min), max)
        : fallback,
  };
}

const tileColorStore = createPersistedStore<TileColorConfig>(
  "tile-color-config",
  parseTileColorConfig,
);

export function setTileSaturation(saturation: number): void {
  tileColorStore.setState({ ...tileColorStore.getSnapshot(), saturation });
}

export function useTileColorConfig(): TileColorConfig {
  return useSyncExternalStore(
    tileColorStore.subscribe,
    tileColorStore.getSnapshot,
  );
}
