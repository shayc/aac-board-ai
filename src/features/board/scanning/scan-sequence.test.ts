import { describe, expect, test } from "vitest";
import {
  advanceScan,
  selectScan,
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
  return { group, item: null, completedPasses };
}

function atItem(
  group: string,
  item: string,
  completedPasses = 0,
): ScanPosition<string> {
  return { group, item, completedPasses };
}

function advanceTimes(
  position: ScanPosition<string> | null,
  times: number,
  maxGroupPasses = NO_PAUSE,
): ScanPosition<string> | null {
  let current = position;
  for (let step = 0; step < times; step++) {
    current = advanceScan(GROUPS, current, maxGroupPasses);
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
    expect(advanceTimes(atGroup("row 1"), 1)).toEqual(atGroup("play"));
    expect(advanceTimes(atGroup("row 1"), 2)).toEqual(atGroup("row 2"));
  });

  test("returns to the first group after the last, counting the pass", () => {
    expect(advanceTimes(atGroup("row 2"), 1)).toEqual(atGroup("row 1", 1));
  });

  test("pauses once the groups were passed the maximum number of times", () => {
    const maxGroupPasses = 2;
    const stepsPerPass = GROUPS.length;

    expect(
      advanceTimes(atGroup("row 1"), 2 * stepsPerPass - 1, maxGroupPasses),
    ).toEqual(atGroup("row 2", 1));
    expect(
      advanceTimes(atGroup("row 1"), 2 * stepsPerPass, maxGroupPasses),
    ).toBeNull();
  });

  test("moves through the items of an entered group", () => {
    expect(advanceTimes(atItem("row 2", "more"), 1)).toEqual(
      atItem("row 2", "stop"),
    );
    expect(advanceTimes(atItem("row 2", "more"), 2)).toEqual(
      atItem("row 2", "help"),
    );
  });

  test("gives the items a second pass", () => {
    expect(advanceTimes(atItem("row 2", "help"), 1)).toEqual(
      atItem("row 2", "more", 1),
    );
  });

  test("returns to the groups after two passes over the items", () => {
    expect(advanceTimes(atItem("row 2", "help", 1), 1)).toEqual(
      atGroup("row 2"),
    );
  });

  test("restarts at the first group when the current group is gone", () => {
    expect(advanceTimes(atGroup("removed row", 1), 1)).toEqual(
      atGroup("row 1"),
    );
    expect(advanceTimes(atItem("removed row", "yes"), 1)).toEqual(
      atGroup("row 1"),
    );
  });

  test("continues at the first item when the current item is gone", () => {
    expect(advanceTimes(atItem("row 2", "removed tile"), 1)).toEqual(
      atItem("row 2", "more"),
    );
  });

  test("stays paused when there is nothing to scan", () => {
    expect(advanceScan([], null, NO_PAUSE)).toBeNull();
    expect(advanceScan([], atGroup("row 1"), NO_PAUSE)).toBeNull();
  });
});

describe("selectScan", () => {
  test("starts a paused scan instead of selecting", () => {
    expect(selectScan(GROUPS, null)).toEqual({
      kind: "moved",
      position: atGroup("row 1"),
    });
  });

  test("enters a group at its first item", () => {
    expect(selectScan(GROUPS, atGroup("row 2", 1))).toEqual({
      kind: "moved",
      position: atItem("row 2", "more"),
    });
  });

  test("activates the only item of a single-item group", () => {
    expect(selectScan(GROUPS, atGroup("play"))).toEqual({
      kind: "activated",
      target: "play button",
    });
  });

  test("activates the current item", () => {
    expect(selectScan(GROUPS, atItem("row 2", "stop"))).toEqual({
      kind: "activated",
      target: "stop",
    });
  });

  test("restarts instead of selecting when the current group is gone", () => {
    expect(selectScan(GROUPS, atItem("removed row", "yes"))).toEqual({
      kind: "moved",
      position: atGroup("row 1"),
    });
  });

  test("returns to the first item instead of activating an item that is gone", () => {
    expect(selectScan(GROUPS, atItem("row 2", "removed tile", 1))).toEqual({
      kind: "moved",
      position: atItem("row 2", "more"),
    });
  });
});
