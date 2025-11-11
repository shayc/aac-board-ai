/* eslint-disable @typescript-eslint/unbound-method */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AIError,
  proofread,
  rewrite,
  translate,
  isAvailable,
  clearCache,
  type Tone,
  type LanguageCode,
} from "./aiService";

// Mock Chrome Built-in AI APIs
const mockProofreader = {
  proofread: vi.fn(),
  destroy: vi.fn(),
};

const mockRewriter = {
  rewrite: vi.fn(),
  destroy: vi.fn(),
};

const mockTranslator = {
  translate: vi.fn(),
  destroy: vi.fn(),
};

// Setup global mocks
beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks();

  // Mock Proofreader
  (globalThis as unknown as { Proofreader: typeof Proofreader }).Proofreader = {
    availability: vi.fn().mockResolvedValue("available"),
    create: vi.fn().mockResolvedValue(mockProofreader),
  } as unknown as typeof Proofreader;

  // Mock Rewriter
  (globalThis as unknown as { Rewriter: typeof Rewriter }).Rewriter = {
    availability: vi.fn().mockResolvedValue("available"),
    create: vi.fn().mockResolvedValue(mockRewriter),
  } as unknown as typeof Rewriter;

  // Mock Translator
  (globalThis as unknown as { Translator: typeof Translator }).Translator = {
    availability: vi.fn().mockResolvedValue("available"),
    create: vi.fn().mockResolvedValue(mockTranslator),
  } as unknown as typeof Translator;

  // Clear cache before each test
  void clearCache();
});

describe("isAvailable", () => {
  it("should return true when Proofreader API is available", () => {
    expect(isAvailable("proofreader")).toBe(true);
  });

  it("should return true when Rewriter API is available", () => {
    expect(isAvailable("rewriter")).toBe(true);
  });

  it("should return true when Translator API is available", () => {
    expect(isAvailable("translator")).toBe(true);
  });

  it("should return false when API is not available", () => {
    delete (globalThis as { Proofreader?: typeof Proofreader }).Proofreader;
    expect(isAvailable("proofreader")).toBe(false);
  });
});

describe("proofread", () => {
  it("should throw AIError when Proofreader is not available", async () => {
    delete (globalThis as { Proofreader?: typeof Proofreader }).Proofreader;

    await expect(proofread("test text")).rejects.toThrow(AIError);
    await expect(proofread("test text")).rejects.toThrow(
      "Proofreader API is not available",
    );
  });

  it("should successfully proofread text", async () => {
    mockProofreader.proofread.mockResolvedValue({
      correctedInput: "Corrected text",
      corrections: [],
    });

    const result = await proofread("test text");

    expect(result).toBe("Corrected text");
    expect(Proofreader.create).toHaveBeenCalledWith({
      expectedInputLanguages: ["en"],
      signal: undefined,
    });
    expect(mockProofreader.proofread).toHaveBeenCalledWith("test text", {
      signal: undefined,
    });
    expect(mockProofreader.destroy).toHaveBeenCalled();
  });

  it("should handle AbortSignal", async () => {
    const controller = new AbortController();
    mockProofreader.proofread.mockResolvedValue({
      correctedInput: "Corrected text",
      corrections: [],
    });

    const result = await proofread("test text", controller.signal);

    expect(result).toBe("Corrected text");
    expect(Proofreader.create).toHaveBeenCalledWith({
      expectedInputLanguages: ["en"],
      signal: controller.signal,
    });
  });

  it("should throw AIError when aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(proofread("test text", controller.signal)).rejects.toThrow(
      AIError,
    );
    await expect(proofread("test text", controller.signal)).rejects.toThrow(
      "Operation was aborted",
    );
  });

  it("should cache results", async () => {
    mockProofreader.proofread.mockResolvedValue({
      correctedInput: "Corrected text",
      corrections: [],
    });

    // First call
    const result1 = await proofread("test text");
    expect(result1).toBe("Corrected text");
    expect(mockProofreader.proofread).toHaveBeenCalledTimes(1);

    // Second call with same text should use cache
    const result2 = await proofread("test text");
    expect(result2).toBe("Corrected text");
    expect(mockProofreader.proofread).toHaveBeenCalledTimes(1); // Still 1
  });

  it("should throw AIError when API is unavailable", async () => {
    (Proofreader.availability as ReturnType<typeof vi.fn>).mockResolvedValue(
      "unavailable",
    );

    await expect(proofread("test text")).rejects.toThrow(AIError);
    await expect(proofread("test text")).rejects.toThrow(
      "Proofreader is unavailable",
    );
  });
});

describe("rewrite", () => {
  it("should throw AIError when Rewriter is not available", async () => {
    delete (globalThis as { Rewriter?: typeof Rewriter }).Rewriter;

    await expect(rewrite("test text", "casual")).rejects.toThrow(AIError);
    await expect(rewrite("test text", "casual")).rejects.toThrow(
      "Rewriter API is not available",
    );
  });

  it("should validate tone parameter", async () => {
    await expect(rewrite("test text", "invalid" as Tone)).rejects.toThrow(
      AIError,
    );
    await expect(rewrite("test text", "invalid" as Tone)).rejects.toThrow(
      "Invalid tone",
    );
  });

  it("should successfully rewrite text with casual tone", async () => {
    mockRewriter.rewrite.mockResolvedValue("Casual text");

    const result = await rewrite("test text", "casual");

    expect(result).toBe("Casual text");
    expect(Rewriter.create).toHaveBeenCalledWith({
      tone: "more-casual",
      length: "as-is",
      format: "plain-text",
      signal: undefined,
    });
    expect(mockRewriter.rewrite).toHaveBeenCalledWith("test text", {
      signal: undefined,
    });
    expect(mockRewriter.destroy).toHaveBeenCalled();
  });

  it("should map formal tone correctly", async () => {
    mockRewriter.rewrite.mockResolvedValue("Formal text");

    await rewrite("test text", "formal");

    expect(Rewriter.create).toHaveBeenCalledWith({
      tone: "more-formal",
      length: "as-is",
      format: "plain-text",
      signal: undefined,
    });
  });

  it("should map neutral tone correctly", async () => {
    mockRewriter.rewrite.mockResolvedValue("Neutral text");

    await rewrite("test text", "neutral");

    expect(Rewriter.create).toHaveBeenCalledWith({
      tone: "as-is",
      length: "as-is",
      format: "plain-text",
      signal: undefined,
    });
  });

  it("should cache results per tone", async () => {
    mockRewriter.rewrite.mockResolvedValue("Casual text");

    // First call with casual
    await rewrite("test text", "casual");
    expect(mockRewriter.rewrite).toHaveBeenCalledTimes(1);

    // Second call with casual should use cache
    await rewrite("test text", "casual");
    expect(mockRewriter.rewrite).toHaveBeenCalledTimes(1);

    // Call with different tone should not use cache
    mockRewriter.rewrite.mockResolvedValue("Formal text");
    await rewrite("test text", "formal");
    expect(mockRewriter.rewrite).toHaveBeenCalledTimes(2);
  });
});

describe("translate", () => {
  it("should throw AIError when Translator is not available", async () => {
    delete (globalThis as { Translator?: typeof Translator }).Translator;

    await expect(translate("test text", "es")).rejects.toThrow(AIError);
    await expect(translate("test text", "es")).rejects.toThrow(
      "Translator API is not available",
    );
  });

  it("should validate target language code", async () => {
    await expect(
      translate("test text", "invalid" as LanguageCode),
    ).rejects.toThrow(AIError);
    await expect(
      translate("test text", "invalid" as LanguageCode),
    ).rejects.toThrow("Invalid target language code");
  });

  it("should validate source language code", async () => {
    await expect(
      translate("test text", "es", "invalid" as LanguageCode),
    ).rejects.toThrow(AIError);
    await expect(
      translate("test text", "es", "invalid" as LanguageCode),
    ).rejects.toThrow("Invalid source language code");
  });

  it("should successfully translate text", async () => {
    mockTranslator.translate.mockResolvedValue("Texto de prueba");

    const result = await translate("test text", "es");

    expect(result).toBe("Texto de prueba");
    expect(Translator.availability).toHaveBeenCalledWith({
      sourceLanguage: "en",
      targetLanguage: "es",
    });
    expect(Translator.create).toHaveBeenCalledWith({
      sourceLanguage: "en",
      targetLanguage: "es",
      signal: undefined,
    });
    expect(mockTranslator.translate).toHaveBeenCalledWith("test text", {
      signal: undefined,
    });
    expect(mockTranslator.destroy).toHaveBeenCalled();
  });

  it("should use custom source language", async () => {
    mockTranslator.translate.mockResolvedValue("Test text");

    await translate("texto de prueba", "en", "es");

    expect(Translator.availability).toHaveBeenCalledWith({
      sourceLanguage: "es",
      targetLanguage: "en",
    });
    expect(Translator.create).toHaveBeenCalledWith({
      sourceLanguage: "es",
      targetLanguage: "en",
      signal: undefined,
    });
  });

  it("should throw UNSUPPORTED_LANG error when language pair unavailable", async () => {
    (Translator.availability as ReturnType<typeof vi.fn>).mockResolvedValue(
      "unavailable",
    );

    await expect(translate("test text", "es")).rejects.toThrow(AIError);
    const error = await translate("test text", "es").catch((e) => e as AIError);
    expect(error.code).toBe("UNSUPPORTED_LANG");
  });

  it("should cache results per language pair", async () => {
    mockTranslator.translate.mockResolvedValue("Texto de prueba");

    // First call
    await translate("test text", "es");
    expect(mockTranslator.translate).toHaveBeenCalledTimes(1);

    // Second call with same params should use cache
    await translate("test text", "es");
    expect(mockTranslator.translate).toHaveBeenCalledTimes(1);

    // Different target language should not use cache
    mockTranslator.translate.mockResolvedValue("Texte de test");
    await translate("test text", "fr");
    expect(mockTranslator.translate).toHaveBeenCalledTimes(2);
  });
});
