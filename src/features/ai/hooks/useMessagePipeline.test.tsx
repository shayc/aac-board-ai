import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "vitest-browser-react";
import { useMessagePipeline } from "./useMessagePipeline";
import * as aiService from "@features/ai/aiService";

// Mock the aiService module
vi.mock("@features/ai/aiService", () => ({
  isAvailable: vi.fn(),
  proofread: vi.fn(),
  rewrite: vi.fn(),
  translate: vi.fn(),
  AIError: class AIError extends Error {
    readonly code: string;

    constructor(code: string, message: string) {
      super(message);
      this.name = "AIError";
      this.code = code;
    }
  },
}));

describe("useMessagePipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (aiService.isAvailable as ReturnType<typeof vi.fn>).mockReturnValue(true);
  });

  it("should start with idle step", async () => {
    const { result } = await renderHook(() => useMessagePipeline());

    expect(result.current.step).toBe("idle");
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("should successfully run proofread-only pipeline", async () => {
    (aiService.proofread as ReturnType<typeof vi.fn>).mockResolvedValue(
      "Corrected text",
    );

    const { result } = await renderHook(() => useMessagePipeline());

    await result.current.run("test text");

    // Wait for completion
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.step).toBe("done");
    expect(result.current.result).toEqual({
      original: "test text",
      proofread: "Corrected text",
      final: "Corrected text",
      skippedSteps: [],
    });
  });

  it("should run full pipeline with all transformations", async () => {
    (aiService.proofread as ReturnType<typeof vi.fn>).mockResolvedValue(
      "Corrected text",
    );
    (aiService.rewrite as ReturnType<typeof vi.fn>).mockResolvedValue(
      "Formal text",
    );
    (aiService.translate as ReturnType<typeof vi.fn>).mockResolvedValue(
      "Texto formal",
    );

    const { result } = await renderHook(() => useMessagePipeline());

    await result.current.run("test text", {
      tone: "formal",
      translateTo: "es",
    });

    // Wait for completion
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.step).toBe("done");
    expect(result.current.result).toEqual({
      original: "test text",
      proofread: "Corrected text",
      rewritten: "Formal text",
      translated: "Texto formal",
      final: "Texto formal",
      skippedSteps: [],
    });
  });

  it("should skip unavailable proofreader", async () => {
    (aiService.isAvailable as ReturnType<typeof vi.fn>).mockImplementation(
      (kind: string) => kind !== "proofreader",
    );
    (aiService.rewrite as ReturnType<typeof vi.fn>).mockResolvedValue(
      "Formal text",
    );

    const { result } = await renderHook(() => useMessagePipeline());

    await result.current.run("test text", { tone: "formal" });

    // Wait for completion
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.step).toBe("done");
    expect(result.current.result?.skippedSteps).toContain("proofread");
    expect(result.current.result?.proofread).toBeUndefined();
    expect(result.current.result?.rewritten).toBe("Formal text");
    expect(result.current.result?.final).toBe("Formal text");
  });

  it("should skip rewrite step if tone is not provided", async () => {
    (aiService.proofread as ReturnType<typeof vi.fn>).mockResolvedValue(
      "Corrected text",
    );

    const { result } = await renderHook(() => useMessagePipeline());

    await result.current.run("test text", {});

    // Wait for completion
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.step).toBe("done");
    expect(aiService.rewrite).not.toHaveBeenCalled();
    expect(result.current.result?.rewritten).toBeUndefined();
  });

  it("should skip translate step if translateTo is not provided", async () => {
    (aiService.proofread as ReturnType<typeof vi.fn>).mockResolvedValue(
      "Corrected text",
    );

    const { result } = await renderHook(() => useMessagePipeline());

    await result.current.run("test text", {});

    // Wait for completion
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.step).toBe("done");
    expect(aiService.translate).not.toHaveBeenCalled();
    expect(result.current.result?.translated).toBeUndefined();
  });

  it("should handle AIError with UNAVAILABLE code as skip", async () => {
    (aiService.proofread as ReturnType<typeof vi.fn>).mockRejectedValue(
      new aiService.AIError("UNAVAILABLE", "Proofreader unavailable"),
    );

    const { result } = await renderHook(() => useMessagePipeline());

    await result.current.run("test text");

    // Wait for completion
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.step).toBe("done");
    expect(result.current.result?.skippedSteps).toContain("proofread");
    expect(result.current.result?.final).toBe("test text");
  });

  it("should transition to error state on non-UNAVAILABLE error", async () => {
    (aiService.proofread as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Internal error"),
    );

    const { result } = await renderHook(() => useMessagePipeline());

    await result.current.run("test text");

    // Wait for completion
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(result.current.step).toBe("error");
    expect(result.current.error?.message).toBe("Internal error");
    expect(result.current.result).toBeNull();
  });
});
