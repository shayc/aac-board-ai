import { describe, expect, test } from "vitest";
import { isApplePlatform } from "./key-shortcuts";

describe("isApplePlatform", () => {
  test.each(["MacIntel", "macOS", "iPhone", "iPad"])(
    "%s uses Apple's key symbols",
    (platform) => {
      expect(isApplePlatform(platform)).toBe(true);
    },
  );

  test.each(["Win32", "Windows", "Linux x86_64", "Android", "Chrome OS"])(
    "%s uses key names",
    (platform) => {
      expect(isApplePlatform(platform)).toBe(false);
    },
  );
});
