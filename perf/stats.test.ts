import assert from "node:assert/strict";
import { test } from "node:test";
import {
  differenceInterval,
  growthSignP,
  holmAdjust,
  median,
  signedRankP,
  smallestSignedRankP,
  spreadOf,
  typicalDifference,
} from "./stats.ts";

await test("median takes the middle value, interpolating between two", () => {
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});

await test("median is NaN without values", () => {
  assert.ok(Number.isNaN(median([])));
});

await test("spreadOf reports the 25th and 75th percentiles", () => {
  assert.deepEqual(spreadOf([5, 4, 3, 2, 1]), { median: 3, p25: 2, p75: 4 });
});

await test("signedRankP is the smallest possible when every round moved the same way", () => {
  assert.equal(signedRankP([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 2 / 2 ** 10);
  assert.equal(smallestSignedRankP(10), 2 / 2 ** 10);
});

// 43 of the 1024 sign assignments put a rank sum of 10 or less on one side.
await test("signedRankP counts the sign assignments at least as extreme", () => {
  assert.equal(signedRankP([1, 2, 3, 4, 5, 6, 7, 8, 9, -10]), 86 / 1024);
});

await test("signedRankP is 1 when gains and losses balance", () => {
  assert.equal(signedRankP([1, -1, 2, -2]), 1);
});

await test("signedRankP leaves out rounds that did not change", () => {
  assert.equal(signedRankP([0, 0, 1, 2, 3]), 2 / 2 ** 3);
  assert.equal(signedRankP([0, 0, 0]), 1);
});

await test("signedRankP shares ranks between tied sizes", () => {
  assert.equal(signedRankP([8, 8, 8, -8]), 10 / 16);
});

await test("typicalDifference is the median of all pair averages", () => {
  assert.equal(typicalDifference([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]), 5.5);
  assert.equal(typicalDifference([0, 0, 0, 0, 100]), 0);
});

// With 10 samples the 95% interval runs from the 9th smallest to the 9th
// largest pair average, as in published signed-rank tables.
await test("differenceInterval spans the differences the test would not reject", () => {
  assert.deepEqual(differenceInterval([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.95), {
    low: 3,
    high: 8,
  });
});

await test("differenceInterval is undefined with too few samples", () => {
  assert.equal(differenceInterval([1, 2, 3], 0.95), undefined);
});

await test("holmAdjust multiplies by the number of tests still in play", () => {
  assert.deepEqual(holmAdjust([0.01, 0.04, 0.03]), [0.03, 0.06, 0.06]);
  assert.deepEqual(holmAdjust([0.5, 0.9]), [1, 1]);
});

await test("growthSignP is small when every sample grew", () => {
  assert.equal(growthSignP(Array.from({ length: 10 }, () => 1)), 1 / 1024);
});

await test("growthSignP is large when growth and shrinkage balance", () => {
  assert.equal(growthSignP([1, 1, 1, 1, 1, -1, -1, -1, -1, -1]), 638 / 1024);
});

await test("growthSignP leaves out samples that did not change", () => {
  assert.equal(growthSignP([1, 1, 0, 0]), 1 / 4);
});
