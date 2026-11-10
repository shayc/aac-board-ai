import { describe, expect, test } from "vitest";
import {
  isFirstScanStep,
  nextScanState,
  PAUSED_SCAN,
  type ScanEvent,
  type ScanMethod,
  type ScanState,
} from "./scan-model";

const AUTO = { method: "auto", scanCount: 2 } as const;
const STEP = { method: "step", scanCount: 2 } as const;

function runScan(
  events: readonly ScanEvent[],
  groupSizes: readonly number[],
  options: { method: ScanMethod; scanCount: number } = AUTO,
) {
  let state: ScanState = PAUSED_SCAN;
  const selections = [];

  for (const event of events) {
    const step = nextScanState(state, event, groupSizes, options);
    state = step.state;

    if (step.selection) {
      selections.push(step.selection);
    }
  }

  return { state, selections };
}

describe("nextScanState", () => {
  test.each(["next", "select"] as const)(
    "starts at the first group on a %s press without selecting",
    (event) => {
      expect(runScan([event], [1, 3])).toEqual({
        state: { status: "groups", groupIndex: 0, pass: 0 },
        selections: [],
      });
    },
  );

  test("stays paused when there is nothing to scan", () => {
    expect(runScan(["next", "select"], [])).toEqual({
      state: PAUSED_SCAN,
      selections: [],
    });
  });

  test("moves through the groups in order", () => {
    expect(runScan(["next", "next", "next"], [1, 3, 2]).state).toEqual({
      status: "groups",
      groupIndex: 2,
      pass: 0,
    });
  });

  test("auto scan pauses after the set number of scans", () => {
    const afterOnePass = runScan(["next", "next", "next"], [1, 3]);
    const afterTwoPasses = runScan(
      ["next", "next", "next", "next", "next"],
      [1, 3],
    );

    expect(afterOnePass.state).toEqual({
      status: "groups",
      groupIndex: 0,
      pass: 1,
    });
    expect(afterTwoPasses.state).toEqual(PAUSED_SCAN);
  });

  test("step scan wraps around without pausing", () => {
    const events = Array.from({ length: 9 }, () => "next" as const);

    expect(runScan(events, [1, 3], STEP).state).toMatchObject({
      status: "groups",
      groupIndex: 0,
    });
  });

  test("selects a single-target group directly and restarts", () => {
    expect(runScan(["next", "select"], [1, 3])).toEqual({
      state: { status: "groups", groupIndex: 0, pass: 0 },
      selections: [{ groupIndex: 0, itemIndex: 0 }],
    });
  });

  test("enters a group, then selects a target and restarts", () => {
    expect(
      runScan(["next", "next", "select", "next", "select"], [1, 3]),
    ).toEqual({
      state: { status: "groups", groupIndex: 0, pass: 0 },
      selections: [{ groupIndex: 1, itemIndex: 1 }],
    });
  });

  test("offers an exit step after the last target that returns to the groups", () => {
    const atExitStep = runScan(
      ["next", "next", "select", "next", "next"],
      [1, 2],
    );
    const afterExit = runScan(
      ["next", "next", "select", "next", "next", "select"],
      [1, 2],
    );

    expect(atExitStep.state).toEqual({
      status: "items",
      groupIndex: 1,
      itemIndex: 2,
      pass: 0,
    });
    expect(afterExit).toEqual({
      state: { status: "groups", groupIndex: 1, pass: 0 },
      selections: [],
    });
  });

  test("auto scan returns to the groups after the set number of scans inside a group", () => {
    const enterGroup = ["next", "next", "select"] as const;
    const onePass = ["next", "next", "next"] as const;

    expect(runScan([...enterGroup, ...onePass], [1, 2]).state).toEqual({
      status: "items",
      groupIndex: 1,
      itemIndex: 0,
      pass: 1,
    });
    expect(
      runScan([...enterGroup, ...onePass, ...onePass], [1, 2]).state,
    ).toEqual({ status: "groups", groupIndex: 1, pass: 0 });
  });

  test("step scan wraps around inside a group until the exit step is selected", () => {
    const enterGroup = ["next", "next", "select"] as const;
    const threePasses = Array.from({ length: 9 }, () => "next" as const);

    expect(
      runScan([...enterGroup, ...threePasses], [1, 2], STEP).state,
    ).toMatchObject({ status: "items", groupIndex: 1, itemIndex: 0 });
  });

  test("restarts at the first group when the layout no longer holds the position", () => {
    const stale: ScanState = {
      status: "items",
      groupIndex: 2,
      itemIndex: 1,
      pass: 0,
    };

    expect(nextScanState(stale, "select", [1, 3], AUTO)).toEqual({
      state: { status: "groups", groupIndex: 0, pass: 0 },
    });
  });
});

describe("isFirstScanStep", () => {
  test.each<[ScanState, boolean]>([
    [PAUSED_SCAN, false],
    [{ status: "groups", groupIndex: 0, pass: 1 }, true],
    [{ status: "groups", groupIndex: 1, pass: 0 }, false],
    [{ status: "items", groupIndex: 1, itemIndex: 0, pass: 0 }, true],
    [{ status: "items", groupIndex: 0, itemIndex: 1, pass: 0 }, false],
  ])("%o → %s", (state, expected) => {
    expect(isFirstScanStep(state)).toBe(expected);
  });
});
