import { afterEach, describe, expect, test, vi } from "vitest";
import { renderHook } from "vitest-browser-react";
import { makeAIFake } from "../internal/test-fakes/ai-namespace-fake.ts";
import { buildProofreaderInstance } from "../internal/test-fakes/instance-fakes.ts";
import { useProofreader } from "./useProofreader.ts";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useProofreader", () => {
  test("reaches ready", async () => {
    const { Fake } = makeAIFake({ buildInstance: buildProofreaderInstance });
    vi.stubGlobal("Proofreader", Fake);

    const { result } = await renderHook(() => useProofreader());

    await vi.waitFor(() => expect(result.current.status).toBe("ready"));
  });

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

  test("ProofreaderHookReturn omits inputQuota and measureInput (compile-time)", () => {
    // Arrow wrapper keeps the hook out of runtime; tsc still type-checks the
    // member accesses below and fires @ts-expect-error if either is present.
    void (() => {
      const ret = useProofreader();
      // @ts-expect-error - inputQuota is not part of ProofreaderHookReturn
      void ret.inputQuota;
      // @ts-expect-error - measureInput is not part of ProofreaderHookReturn
      void ret.measureInput;
    });
  });
});
