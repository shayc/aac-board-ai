import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { makeAIFake } from "../../internal/__tests__/mocks/ai-namespace-fake.ts";
import { buildProofreaderInstance } from "../../internal/__tests__/mocks/instance-fakes.ts";
import { useProofreader } from "../useProofreader.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useProofreader", () => {
  test("proofread() forwards input and returns a ProofreadResult from the instance", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildProofreaderInstance });
    vi.stubGlobal("Proofreader", Fake);

    const { result } = await renderHook(() => useProofreader());
    await vi.waitFor(() => expect(result.current.status).toBe("ready"));

    const out = await result.current.proofread("helo world");
    // The fake echoes input into correctedInput so input-forwarding is
    // observable from the resolved value alone.
    expect(out.correctedInput).toBe("corrected(helo world)");
    expect(out.corrections).toHaveLength(1);
    expect(out.corrections[0]).toMatchObject({
      startIndex: 0,
      endIndex: 5,
      correction: "Hello",
    });
  });
});
