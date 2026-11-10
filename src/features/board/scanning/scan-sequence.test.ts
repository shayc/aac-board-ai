import { describe, expect, test } from "vitest";
import {
  advanceScan,
  selectScanTarget,
  startScan,
  type ScanGroup,
  type ScanPosition,
} from "./scan-sequence";

const GROUPS: ScanGroup<string>[] = [
  { container: "row 1", items: ["yes", "no"] },
  { container: "play", items: ["play button"] },
  { container: "row 2", items: ["more", "stop", "help"] },
];

const NO_PAUSE = Infinity;

function atGroup(group: string, completedPasses = 0): ScanPosition<string> {
  return { level: "groups", container: group, completedPasses };
}

function atItem(
  group: string,
  item: string,
  completedPasses = 0,
): ScanPosition<string> {
  return { level: "items", container: group, item, completedPasses };
}

function atExit(group: string, completedPasses = 0): ScanPosition<string> {
  return { level: "exit", container: group, completedPasses };
}

function advanceRepeatedly(
  position: ScanPosition<string> | null,
  times: number,
  maxPasses = NO_PAUSE,
): ScanPosition<string> | null {
  let current = position;
  for (let step = 0; step < times; step++) {
    current = advanceScan(GROUPS, current, maxPasses);
  }

  return current;
}

describe("startScan", () => {
  test("starts at the first group", () => {
    expect(startScan(GROUPS)).toEqual(atGroup("row 1"));
  });

  test("stays paused when there is nothing to scan", () => {
    expect(startScan([])).toBeNull();
  });
});

describe("advanceScan", () => {
  test("starts a paused scan at the first group", () => {
    expect(advanceScan(GROUPS, null, NO_PAUSE)).toEqual(atGroup("row 1"));
  });

  test("moves through the groups in order", () => {
    expect(advanceRepeatedly(atGroup("row 1"), 1)).toEqual(atGroup("play"));
    expect(advanceRepeatedly(atGroup("row 1"), 2)).toEqual(atGroup("row 2"));
  });

  test("returns to the first group after the last, counting the pass", () => {
    expect(advanceRepeatedly(atGroup("row 2"), 1)).toEqual(atGroup("row 1", 1));
  });

  test("pauses once the groups were passed the maximum number of times", () => {
    const maxPasses = 2;
    const stepsPerPass = GROUPS.length;

    expect(
      advanceRepeatedly(atGroup("row 1"), 2 * stepsPerPass - 1, maxPasses),
    ).toEqual(atGroup("row 2", 1));
    expect(
      advanceRepeatedly(atGroup("row 1"), 2 * stepsPerPass, maxPasses),
    ).toBeNull();
  });

  test("moves through the items of an entered group", () => {
    expect(advanceRepeatedly(atItem("row 2", "more"), 1)).toEqual(
      atItem("row 2", "stop"),
    );
    expect(advanceRepeatedly(atItem("row 2", "more"), 2)).toEqual(
      atItem("row 2", "help"),
    );
  });

  test("offers an exit step after the last item", () => {
    expect(advanceRepeatedly(atItem("row 2", "help"), 1)).toEqual(
      atExit("row 2"),
    );
  });

  test("returns to the first item after the exit step, counting the pass", () => {
    expect(advanceRepeatedly(atExit("row 2"), 1)).toEqual(
      atItem("row 2", "more", 1),
    );
  });

  test("moves on to the next group once the items were passed the maximum number of times", () => {
    const maxPasses = 2;

    expect(advanceRepeatedly(atExit("row 1"), 1, maxPasses)).toEqual(
      atItem("row 1", "yes", 1),
    );
    expect(advanceRepeatedly(atExit("row 1", 1), 1, maxPasses)).toEqual(
      atGroup("play"),
    );
  });

  test("restarts at the first group when the current group is gone", () => {
    expect(advanceRepeatedly(atGroup("removed row", 1), 1)).toEqual(
      atGroup("row 1"),
    );
    expect(advanceRepeatedly(atItem("removed row", "yes"), 1)).toEqual(
      atGroup("row 1"),
    );
    expect(advanceRepeatedly(atExit("removed row"), 1)).toEqual(
      atGroup("row 1"),
    );
  });

  test("continues at the first item when the current item is gone", () => {
    expect(advanceRepeatedly(atItem("row 2", "removed tile"), 1)).toEqual(
      atItem("row 2", "more"),
    );
  });

  test("stays paused when there is nothing to scan", () => {
    expect(advanceScan([], null, NO_PAUSE)).toBeNull();
    expect(advanceScan([], atGroup("row 1"), NO_PAUSE)).toBeNull();
  });
});

describe("selectScanTarget", () => {
  test("starts a paused scan instead of selecting", () => {
    expect(selectScanTarget(GROUPS, null)).toEqual({
      kind: "moved",
      position: atGroup("row 1"),
    });
  });

  test("enters a group at its first item", () => {
    expect(selectScanTarget(GROUPS, atGroup("row 2", 1))).toEqual({
      kind: "moved",
      position: atItem("row 2", "more"),
    });
  });

  test("activates the only item of a single-item group", () => {
    expect(selectScanTarget(GROUPS, atGroup("play"))).toEqual({
      kind: "activated",
      target: "play button",
    });
  });

  test("activates the current item", () => {
    expect(selectScanTarget(GROUPS, atItem("row 2", "stop"))).toEqual({
      kind: "activated",
      target: "stop",
    });
  });

  test("returns to the groups when the exit step is selected", () => {
    expect(selectScanTarget(GROUPS, atExit("row 2", 1))).toEqual({
      kind: "moved",
      position: atGroup("row 2"),
    });
  });

  test("restarts instead of selecting when the current group is gone", () => {
    expect(selectScanTarget(GROUPS, atItem("removed row", "yes"))).toEqual({
      kind: "moved",
      position: atGroup("row 1"),
    });
  });

  test("returns to the first item instead of activating an item that is gone", () => {
    expect(
      selectScanTarget(GROUPS, atItem("row 2", "removed tile", 1)),
    ).toEqual({
      kind: "moved",
      position: atItem("row 2", "more"),
    });
  });
});
