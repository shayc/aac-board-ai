import { useExternalStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import {
  parseClampedNumber,
  type ClampedNumberOptions,
} from "@shared/utils/parse-clamped-number";

// 70% is the dimmest level whose symbols and labels were checked by eye.
export const BOARD_BRIGHTNESS: ClampedNumberOptions = {
  min: 0.7,
  max: 1,
  defaultValue: 1,
};

export function parseBoardBrightness(raw: unknown): number {
  return parseClampedNumber(raw, BOARD_BRIGHTNESS);
}

const boardBrightnessStore = createPersistedStore<number>(
  "board-brightness",
  parseBoardBrightness,
);

export function setBoardBrightness(brightness: number): void {
  boardBrightnessStore.setState(brightness);
}

export function useBoardBrightness(): number {
  return useExternalStore(boardBrightnessStore);
}
