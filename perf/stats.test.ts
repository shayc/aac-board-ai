import assert from "node:assert/strict";
import { test } from "node:test";
import { growthSignP, mannWhitneyP, median, spreadOf } from "./stats.ts";

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

// Reference values computed separately in Python with math.erfc, from the
// same tie- and continuity-corrected normal approximation. They pin this
// implementation; they were not checked against SciPy itself.
await test("mannWhitneyP matches the reference for fully separated samples", () => {
  const p = mannWhitneyP([1, 2, 3, 4, 5], [6, 7, 8, 9, 10]);

  assert.ok(Math.abs(p - 0.012185780355344815) < 1e-6);
});

await test("mannWhitneyP matches the reference with Event Timing ties", () => {
  const p = mannWhitneyP(
    [48, 48, 48, 56, 48, 48, 40, 48],
    [56, 56, 48, 64, 56, 56, 56, 48],
  );

  assert.ok(Math.abs(p - 0.015177706757018239) < 1e-6);
});

await test("mannWhitneyP gives the same p in either order", () => {
  const baseline = [10, 12, 11, 14, 13];
  const current = [15, 12, 16, 18, 17];

  assert.equal(
    mannWhitneyP(baseline, current),
    mannWhitneyP(current, baseline),
  );
});

await test("mannWhitneyP never finds a difference between identical constant samples", () => {
  assert.equal(mannWhitneyP([48, 48, 48], [48, 48, 48]), 1);
});

await test("mannWhitneyP has no p without samples on both sides", () => {
  assert.ok(Number.isNaN(mannWhitneyP([], [1, 2])));
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
