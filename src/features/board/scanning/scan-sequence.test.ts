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

function atGroup(container: string, completedPasses = 0): ScanPosition<string> {
  return { level: "groups", container, completedPasses };
}

function atItem(
  container: string,
  item: string,
  completedPasses = 0,
): ScanPosition<string> {
  return { level: "items", container, item, completedPasses };
}

function atExit(container: string, completedPasses = 0): ScanPosition<string> {
  return { level: "exit", container, completedPasses };
}

function advanceTimes(
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
    expect(advanceTimes(atGroup("row 1"), 1)).toEqual(atGroup("play"));
    expect(advanceTimes(atGroup("row 1"), 2)).toEqual(atGroup("row 2"));
  });

  test("returns to the first group after the last, counting the pass", () => {
    expect(advanceTimes(atGroup("row 2"), 1)).toEqual(atGroup("row 1", 1));
  });

  test("pauses once the groups were passed the maximum number of times", () => {
    const maxPasses = 2;
    const stepsPerPass = GROUPS.length;

    expect(
      advanceTimes(atGroup("row 1"), 2 * stepsPerPass - 1, maxPasses),
    ).toEqual(atGroup("row 2", 1));
    expect(
      advanceTimes(atGroup("row 1"), 2 * stepsPerPass, maxPasses),
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

  test("offers an exit step after the last item", () => {
    expect(advanceTimes(atItem("row 2", "help"), 1)).toEqual(atExit("row 2"));
  });

  test("returns to the first item after the exit step, counting the pass", () => {
    expect(advanceTimes(atExit("row 2"), 1)).toEqual(
      atItem("row 2", "more", 1),
    );
  });

  test("moves on to the next group once the items were passed the maximum number of times", () => {
    const maxPasses = 2;

    expect(advanceTimes(atExit("row 1"), 1, maxPasses)).toEqual(
      atItem("row 1", "yes", 1),
    );
    expect(advanceTimes(atExit("row 1", 1), 1, maxPasses)).toEqual(
      atGroup("play"),
    );
  });

  test("restarts at the first group when the current group is gone", () => {
    expect(advanceTimes(atGroup("removed row", 1), 1)).toEqual(
      atGroup("row 1"),
    );
    expect(advanceTimes(atItem("removed row", "yes"), 1)).toEqual(
      atGroup("row 1"),
    );
    expect(advanceTimes(atExit("removed row"), 1)).toEqual(atGroup("row 1"));
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

  test("returns to the groups when the exit step is selected", () => {
    expect(selectScan(GROUPS, atExit("row 2", 1))).toEqual({
      kind: "moved",
      position: atGroup("row 2"),
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
