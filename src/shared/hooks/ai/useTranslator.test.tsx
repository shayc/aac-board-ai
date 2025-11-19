import { expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useTranslator } from "./useTranslator";

test("returns isTranslatorSupported as true", async () => {
  const { result } = await renderHook(() => useTranslator());
  const { isTranslatorSupported } = result.current;

  expect(isTranslatorSupported).toBe(true);
});
