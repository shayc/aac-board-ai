import { describe, expect, test } from "vitest";
import {
  BuiltInAIError,
  NoUserActivationError,
  NotReadyError,
  UnavailableError,
  UnsupportedError,
} from "./errors";

describe("built-in AI error hierarchy", () => {
  const cases = [
    { ErrorClass: BuiltInAIError, name: "BuiltInAIError" },
    { ErrorClass: UnsupportedError, name: "UnsupportedError" },
    { ErrorClass: UnavailableError, name: "UnavailableError" },
    { ErrorClass: NoUserActivationError, name: "NoUserActivationError" },
    { ErrorClass: NotReadyError, name: "NotReadyError" },
  ] as const;

  test.each(cases)(
    "$name extends BuiltInAIError and exposes name=$name",
    ({ ErrorClass, name }) => {
      const error = new ErrorClass("boom");
      expect(error).toBeInstanceOf(BuiltInAIError);
      expect(error.name).toBe(name);
    },
  );
});
