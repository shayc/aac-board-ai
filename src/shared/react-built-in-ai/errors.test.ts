import { describe, expect, test } from "vitest";
import {
  BuiltInAIError,
  NoUserActivationError,
  NotReadyError,
  UnavailableError,
  UnsupportedError,
} from "./errors.ts";

describe("built-in AI error hierarchy", () => {
  const cases = [
    { Ctor: BuiltInAIError, name: "BuiltInAIError" },
    { Ctor: UnsupportedError, name: "UnsupportedError" },
    { Ctor: UnavailableError, name: "UnavailableError" },
    { Ctor: NoUserActivationError, name: "NoUserActivationError" },
    { Ctor: NotReadyError, name: "NotReadyError" },
  ] as const;

  // Lifecycle uses `instanceof BuiltInAIError` to decide whether to wrap an
  // unknown error; the `name` is what shows up in logs and `instanceof` checks
  // by callers. Both are load-bearing — pin them together.
  test.each(cases)(
    "$name extends BuiltInAIError and exposes name=$name",
    ({ Ctor, name }) => {
      const err = new Ctor("boom");
      expect(err).toBeInstanceOf(BuiltInAIError);
      expect(err.name).toBe(name);
    },
  );
});
