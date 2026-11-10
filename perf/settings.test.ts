import assert from "node:assert/strict";
import { test } from "node:test";
import { parseRoundCount } from "./settings.ts";

await test("parseRoundCount runs 10 rounds unless told otherwise", () => {
  assert.equal(parseRoundCount(undefined), 10);
});

await test("parseRoundCount accepts an even number of rounds", () => {
  assert.equal(parseRoundCount("2"), 2);
});

await test("parseRoundCount refuses rounds that leave one build going first more often", () => {
  assert.throws(() => parseRoundCount("3"), /even number above 0, not 3/);
});

await test("parseRoundCount refuses anything but a positive whole number", () => {
  for (const rounds of ["0", "-2", "2.0", "", "ten"]) {
    assert.throws(() => parseRoundCount(rounds), /even number above 0/);
  }
});
