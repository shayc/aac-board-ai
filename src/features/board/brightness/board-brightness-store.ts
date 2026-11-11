import { useExternalStore } from "@shared/state/external-store";
import { createPersistedStore } from "@shared/state/persisted-store";
import {
  parseClampedNumber,
  type ClampedNumberOptions,
} from "@shared/utils/parse-clamped-number";

// A wide range leaves the choice to the user. Labels and the speaking
// highlight keep their contrast down to this floor.
export const BOARD_BRIGHTNESS: ClampedNumberOptions = {
  min: 0.5,
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
