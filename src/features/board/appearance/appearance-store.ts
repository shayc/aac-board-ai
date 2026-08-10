import { createPersistedStore } from "@shared/utils/persisted-store";
import { useSyncExternalStore } from "react";

export interface BoardAppearanceConfig {
  tileSaturation: number;
  areTileBordersVisible: boolean;
  tileLabelPlacement: TileLabelPlacement;
}

export const TILE_SATURATION = { min: 0, max: 1, fallback: 1 };
export type TileLabelPlacement = "top" | "bottom" | "hidden";

function isTileLabelPlacement(value: unknown): value is TileLabelPlacement {
  return value === "top" || value === "bottom" || value === "hidden";
}

export function parseBoardAppearanceConfig(
  raw: unknown,
): BoardAppearanceConfig {
  const parsed = (raw ?? {}) as Record<string, unknown>;
  const { min, max, fallback } = TILE_SATURATION;

  return {
    tileSaturation:
      typeof parsed.tileSaturation === "number" &&
      Number.isFinite(parsed.tileSaturation)
        ? Math.min(Math.max(parsed.tileSaturation, min), max)
        : fallback,
    areTileBordersVisible:
      typeof parsed.areTileBordersVisible === "boolean"
        ? parsed.areTileBordersVisible
        : false,
    tileLabelPlacement: isTileLabelPlacement(parsed.tileLabelPlacement)
      ? parsed.tileLabelPlacement
      : "top",
  };
}

const appearanceStore = createPersistedStore<BoardAppearanceConfig>(
  "board-appearance",
  parseBoardAppearanceConfig,
);

export function setTileSaturation(tileSaturation: number): void {
  appearanceStore.setState({
    ...appearanceStore.getSnapshot(),
    tileSaturation,
  });
}

export function setTileBordersVisible(areTileBordersVisible: boolean): void {
  appearanceStore.setState({
    ...appearanceStore.getSnapshot(),
    areTileBordersVisible,
  });
}

export function setTileLabelPlacement(
  tileLabelPlacement: TileLabelPlacement,
): void {
  appearanceStore.setState({
    ...appearanceStore.getSnapshot(),
    tileLabelPlacement,
  });
}

export function useBoardAppearanceConfig(): BoardAppearanceConfig {
  return useSyncExternalStore(
    appearanceStore.subscribe,
    appearanceStore.getSnapshot,
  );
}
