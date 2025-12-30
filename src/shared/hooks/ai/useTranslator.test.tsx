import { describe, expect, test } from "vitest";
import { renderHook } from "vitest-browser-react";
import { AIProvider } from "@shared/contexts/AIProvider/AIProvider";
import { useTranslator } from "./useTranslator";

describe("useTranslator", () => {
  test("returns createTranslator function", async () => {
    const { result } = await renderHook(() => useTranslator(), {
      wrapper: AIProvider,
    });
    const { createTranslator } = result.current;

    expect(createTranslator).toBeTypeOf("function");
  });
});
