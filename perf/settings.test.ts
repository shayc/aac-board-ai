import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRoundCount } from "./settings.ts";

await test("parseRoundCount runs 5 x-ray rounds unless told otherwise", () => {
  assert.equal(parseRoundCount(undefined, false), 5);
});

await test("parseRoundCount runs 10 comparison rounds unless told otherwise", () => {
  assert.equal(parseRoundCount(undefined, true), 10);
});

await test("parseRoundCount accepts an odd number of x-ray rounds", () => {
  assert.equal(parseRoundCount("3", false), 3);
});

await test("parseRoundCount accepts an even number of comparison rounds", () => {
  assert.equal(parseRoundCount("2", true), 2);
});

await test("parseRoundCount refuses comparison rounds that leave one build going first more often", () => {
  assert.throws(() => parseRoundCount("3", true), /even number of rounds/);
});

await test("parseRoundCount refuses anything but a positive whole number", () => {
  for (const rounds of ["0", "-2", "2.0", "", "ten"]) {
    assert.throws(() => parseRoundCount(rounds, false), /whole number above 0/);
  }
});
