import { expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { AIProvider } from "@shared/contexts/AIProvider/AIProvider";
import { useTranslator } from "./useTranslator";

test("returns isTranslatorSupported as true", async () => {
  const { result } = await renderHook(() => useTranslator(), {
    wrapper: AIProvider,
  });
  const { isTranslatorSupported } = result.current;

  expect(isTranslatorSupported).toBe(true);
});
