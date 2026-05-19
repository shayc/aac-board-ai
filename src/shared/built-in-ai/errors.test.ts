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

  test.each(cases)(
    "$name extends BuiltInAIError and exposes name=$name",
    ({ Ctor, name }) => {
      const err = new Ctor("boom");
      expect(err).toBeInstanceOf(BuiltInAIError);
      expect(err.name).toBe(name);
    },
  );
});
