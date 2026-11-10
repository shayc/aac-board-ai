export type ScanMethod = "auto" | "step";

/** What a switch press, or the auto scan timer, asks of the scan. */
export type ScanEvent = "next" | "select";

/**
 * Where the highlight is. In `items`, an `itemIndex` equal to the group's
 * target count is the exit step: the whole group is highlighted once more so
 * the user can leave it.
 */
export type ScanState =
  | { status: "paused" }
  | { status: "groups"; groupIndex: number; pass: number }
  | { status: "items"; groupIndex: number; itemIndex: number; pass: number };

export interface ScanSelection {
  groupIndex: number;
  itemIndex: number;
}

interface ScanOptions {
  method: ScanMethod;
  scanCount: number;
}

interface ScanStep {
  state: ScanState;
  selection?: ScanSelection;
}

export const PAUSED_SCAN: ScanState = { status: "paused" };

const FIRST_GROUP_SCAN: ScanState = {
  status: "groups",
  groupIndex: 0,
  pass: 0,
};

/**
 * Advances the scan by one event. `groupSizes` holds the number of targets in
 * each group, in scan order; every group has at least one target.
 */
export function nextScanState(
  state: ScanState,
  event: ScanEvent,
  groupSizes: readonly number[],
  options: ScanOptions,
): ScanStep {
  if (groupSizes.length === 0) {
    return { state: PAUSED_SCAN };
  }

  if (state.status === "paused" || !isOnLayout(state, groupSizes)) {
    return { state: FIRST_GROUP_SCAN };
  }

  if (state.status === "groups") {
    return event === "next"
      ? { state: nextGroup(state, groupSizes.length, options) }
      : selectGroup(state.groupIndex, groupSizes);
  }

  return event === "next"
    ? { state: nextItem(state, groupSizes, options) }
    : selectItem(state, groupSizes);
}

export function isFirstScanStep(state: ScanState): boolean {
  if (state.status === "paused") {
    return false;
  }

  return state.status === "groups"
    ? state.groupIndex === 0
    : state.itemIndex === 0;
}

function isOnLayout(
  state: Exclude<ScanState, { status: "paused" }>,
  groupSizes: readonly number[],
): boolean {
  const groupSize = groupSizes[state.groupIndex];
  if (groupSize === undefined) {
    return false;
  }

  return state.status === "groups" || state.itemIndex <= groupSize;
}

function nextGroup(
  state: Extract<ScanState, { status: "groups" }>,
  groupCount: number,
  { method, scanCount }: ScanOptions,
): ScanState {
  const groupIndex = state.groupIndex + 1;
  if (groupIndex < groupCount) {
    return { ...state, groupIndex };
  }

  const pass = state.pass + 1;
  if (hasUsedAllScans(pass, { method, scanCount })) {
    return PAUSED_SCAN;
  }

  return { status: "groups", groupIndex: 0, pass };
}

// Step scan only moves on a press, so it wraps around instead of giving up.
function hasUsedAllScans(pass: number, { method, scanCount }: ScanOptions) {
  return method === "auto" && pass >= scanCount;
}

function selectGroup(
  groupIndex: number,
  groupSizes: readonly number[],
): ScanStep {
  if (groupSizes[groupIndex] === 1) {
    return {
      state: FIRST_GROUP_SCAN,
      selection: { groupIndex, itemIndex: 0 },
    };
  }

  return { state: { status: "items", groupIndex, itemIndex: 0, pass: 0 } };
}

function nextItem(
  state: Extract<ScanState, { status: "items" }>,
  groupSizes: readonly number[],
  options: ScanOptions,
): ScanState {
  const isExitStep = state.itemIndex === groupSizes[state.groupIndex];
  if (!isExitStep) {
    return { ...state, itemIndex: state.itemIndex + 1 };
  }

  const pass = state.pass + 1;
  if (hasUsedAllScans(pass, options)) {
    return { status: "groups", groupIndex: state.groupIndex, pass: 0 };
  }

  return { ...state, itemIndex: 0, pass };
}

function selectItem(
  state: Extract<ScanState, { status: "items" }>,
  groupSizes: readonly number[],
): ScanStep {
  const isExitStep = state.itemIndex === groupSizes[state.groupIndex];
  if (isExitStep) {
    return {
      state: { status: "groups", groupIndex: state.groupIndex, pass: 0 },
    };
  }

  return {
    state: FIRST_GROUP_SCAN,
    selection: { groupIndex: state.groupIndex, itemIndex: state.itemIndex },
  };
}
