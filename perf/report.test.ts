import assert from "node:assert/strict";
import { test } from "node:test";
import type { Budget } from "./budgets.ts";
import { formatScorecard } from "./report.ts";
import { scoreMeasurements } from "./scorecard.ts";

const TAP: Budget = { name: "tap", label: "word tap", unit: "ms", limit: 100 };
const VISIT: Budget = {
  name: "visit",
  label: "return visit",
  unit: "ms",
  limit: 1000,
};
const SIZE: Budget = { name: "size", label: "JS", unit: "kB", limit: 420 };

function report(measurements: Record<string, number[]>): string {
  const budgets = [TAP, VISIT, SIZE].filter(({ name }) => name in measurements);

  return formatScorecard({
    date: "2026-11-12T12:00:00.000Z",
    settings: { browserVersion: "158.0", cpuSlowdown: 4, roundCount: 5 },
    build: { source: "working tree", commit: "abc1234", buildHash: "0123abcd" },
    ...scoreMeasurements(measurements, budgets),
  });
}

await test("formatScorecard opens with one verdict when every row is ok", () => {
  assert.match(report({ tap: [30], size: [397] }), /^\nPerf x-ray: all 2 ok\n/);
});

await test("formatScorecard counts the problems in its verdict", () => {
  const text = report({
    tap: [90, 95, 110, 120, 125],
    visit: [600],
    size: [431],
  });

  assert.match(text, /Perf x-ray: 1 over, 1 watch, 1 ok/);
});

await test("formatScorecard says how many samples a watched row has over budget", () => {
  const text = report({ tap: [90, 95, 110, 120, 125] });

  assert.match(
    text,
    /watch +word tap +110 ms +budget 100 ms +\(3 of 5 samples over\)/,
  );
  assert.match(text, /Rerun on an idle machine/);
});

await test("formatScorecard explains watch only when a row is watched", () => {
  assert.doesNotMatch(report({ tap: [30] }), /Rerun/);
});

await test("formatScorecard shows a second or more in seconds", () => {
  assert.match(
    report({ visit: [999.6] }),
    /return visit +1\.0 s +budget 1\.0 s/,
  );
  assert.match(report({ visit: [640] }), /return visit +640 ms +budget 1\.0 s/);
});

await test("formatScorecard shows sizes in whole kilobytes", () => {
  assert.match(report({ size: [396.6] }), /JS +397 kB +budget 420 kB/);
});
