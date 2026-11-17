import { expect, test } from "vitest";
import { settleAll } from "./settle-all";

test("keeps fulfilled values in order and returns rejections as errors", async () => {
  const failure = new Error("unreadable");

  const settled = await settleAll([
    Promise.resolve("first"),
    Promise.reject(failure),
    Promise.resolve("third"),
  ]);

  expect(settled).toEqual({ values: ["first", "third"], errors: [failure] });
});

test("resolves with nothing for no promises", async () => {
  await expect(settleAll([])).resolves.toEqual({ values: [], errors: [] });
});
