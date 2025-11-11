/**
 * Centralized AI Service Layer
 *
 * Encapsulates Chrome Built-in AI API calls with:
 * - Capability detection
 * - Unified error handling
 * - Caching (in-memory + optional IndexedDB)
 * - Input validation
 * - Cancellation support via AbortSignal
 */

import { openDB, type IDBPDatabase } from "idb";
import { z } from "zod";

// ============================================================================
// Error Handling
// ============================================================================

export type AIErrorCode =
  | "UNAVAILABLE" // API not available in browser
  | "UNSUPPORTED_LANG" // Language pair not supported
  | "ABORTED" // Operation was cancelled
  | "INTERNAL"; // Internal error from API

export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly cause?: unknown;

  constructor(code: AIErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.cause = cause;
  }
}

// ============================================================================
// Input Validation
// ============================================================================

const ToneSchema = z.enum(["casual", "formal", "neutral"]);
export type Tone = z.infer<typeof ToneSchema>;

// Basic BCP-47 language code validation (simplified)
const LanguageCodeSchema = z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/);
export type LanguageCode = z.infer<typeof LanguageCodeSchema>;

// ============================================================================
// Capability Detection
// ============================================================================

export type AIKind = "proofreader" | "rewriter" | "translator";

export function isAvailable(kind: AIKind): boolean {
  switch (kind) {
    case "proofreader":
      return "Proofreader" in self;
    case "rewriter":
      return "Rewriter" in self;
    case "translator":
      return "Translator" in self;
  }
}

// ============================================================================
// Caching
// ============================================================================

interface CacheKey {
  op: string;
  text: string;
  tone?: Tone;
  targetLang?: LanguageCode;
  sourceLang?: LanguageCode;
}

interface CacheEntry {
  result: string;
  timestamp: number;
}

interface AICacheDBSchema {
  results: {
    key: string;
    value: CacheEntry;
  };
}

const DB_NAME = "ai-cache-db";
const DB_VERSION = 1;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache
const memoryCache = new Map<string, CacheEntry>();

// IndexedDB cache instance (lazy-initialized)
let cacheDB: IDBPDatabase<AICacheDBSchema> | null = null;

function getCacheKey(params: CacheKey): string {
  return JSON.stringify(params);
}

async function getCachedResult(key: string): Promise<string | null> {
  // Check memory cache first
  const memEntry = memoryCache.get(key);
  if (memEntry && Date.now() - memEntry.timestamp < CACHE_TTL) {
    return memEntry.result;
  }

  // Check IndexedDB cache
  try {
    cacheDB ??= await openDB<AICacheDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("results");
      },
    });

    const dbEntry = (await cacheDB.get("results", key)) as
      | CacheEntry
      | undefined;
    if (dbEntry && Date.now() - dbEntry.timestamp < CACHE_TTL) {
      // Populate memory cache
      memoryCache.set(key, dbEntry);
      return dbEntry.result;
    }
  } catch (error) {
    console.warn("Failed to read from cache DB:", error);
  }

  return null;
}

async function setCachedResult(key: string, result: string): Promise<void> {
  const entry: CacheEntry = {
    result,
    timestamp: Date.now(),
  };

  // Update memory cache
  memoryCache.set(key, entry);

  // Update IndexedDB cache
  try {
    cacheDB ??= await openDB<AICacheDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore("results");
      },
    });

    await cacheDB.put("results", entry, key);
  } catch (error) {
    console.warn("Failed to write to cache DB:", error);
  }
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Proofread text for grammar, spelling, and punctuation corrections
 */
export async function proofread(
  text: string,
  signal?: AbortSignal,
): Promise<string> {
  if (!isAvailable("proofreader")) {
    throw new AIError("UNAVAILABLE", "Proofreader API is not available");
  }

  // Check cache
  const cacheKey = getCacheKey({ op: "proofread", text });
  const cached = await getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Check abort before creating
    if (signal?.aborted) {
      throw new AIError("ABORTED", "Operation was aborted");
    }

    const availability = await Proofreader.availability();
    if (availability === "unavailable") {
      throw new AIError("UNAVAILABLE", "Proofreader is unavailable");
    }

    const proofreader = await Proofreader.create({
      expectedInputLanguages: ["en"],
      signal,
    });

    const result = await proofreader.proofread(text, { signal });
    proofreader.destroy();

    // Cache the result
    await setCachedResult(cacheKey, result.correctedInput);

    return result.correctedInput;
  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError" || signal?.aborted) {
        throw new AIError("ABORTED", "Operation was aborted", error);
      }
      throw new AIError(
        "INTERNAL",
        `Proofreading failed: ${error.message}`,
        error,
      );
    }

    throw new AIError("INTERNAL", "Unknown error during proofreading", error);
  }
}

/**
 * Rewrite text with a specific tone
 */
export async function rewrite(
  text: string,
  tone: Tone,
  signal?: AbortSignal,
): Promise<string> {
  if (!isAvailable("rewriter")) {
    throw new AIError("UNAVAILABLE", "Rewriter API is not available");
  }

  // Validate tone
  const validation = ToneSchema.safeParse(tone);
  if (!validation.success) {
    throw new AIError(
      "INTERNAL",
      `Invalid tone: ${tone}. Must be one of: casual, formal, neutral`,
    );
  }

  // Check cache
  const cacheKey = getCacheKey({ op: "rewrite", text, tone });
  const cached = await getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Check abort before creating
    if (signal?.aborted) {
      throw new AIError("ABORTED", "Operation was aborted");
    }

    const availability = await Rewriter.availability();
    if (availability === "unavailable") {
      throw new AIError("UNAVAILABLE", "Rewriter is unavailable");
    }

    // Map our tone enum to Chrome's RewriterTone
    const chromeTone: RewriterTone =
      tone === "casual"
        ? "more-casual"
        : tone === "formal"
          ? "more-formal"
          : "as-is";

    const rewriter = await Rewriter.create({
      tone: chromeTone,
      length: "as-is",
      format: "plain-text",
      signal,
    });

    const result = await rewriter.rewrite(text, { signal });
    rewriter.destroy();

    // Cache the result
    await setCachedResult(cacheKey, result);

    return result;
  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError" || signal?.aborted) {
        throw new AIError("ABORTED", "Operation was aborted", error);
      }
      throw new AIError(
        "INTERNAL",
        `Rewriting failed: ${error.message}`,
        error,
      );
    }

    throw new AIError("INTERNAL", "Unknown error during rewriting", error);
  }
}

/**
 * Translate text to target language
 */
export async function translate(
  text: string,
  targetLang: LanguageCode,
  sourceLang?: LanguageCode,
  signal?: AbortSignal,
): Promise<string> {
  if (!isAvailable("translator")) {
    throw new AIError("UNAVAILABLE", "Translator API is not available");
  }

  // Validate language codes
  const targetValidation = LanguageCodeSchema.safeParse(targetLang);
  if (!targetValidation.success) {
    throw new AIError(
      "INTERNAL",
      `Invalid target language code: ${targetLang}`,
    );
  }

  if (sourceLang) {
    const sourceValidation = LanguageCodeSchema.safeParse(sourceLang);
    if (!sourceValidation.success) {
      throw new AIError(
        "INTERNAL",
        `Invalid source language code: ${sourceLang}`,
      );
    }
  }

  // Check cache
  const cacheKey = getCacheKey({
    op: "translate",
    text,
    targetLang,
    sourceLang,
  });
  const cached = await getCachedResult(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Check abort before creating
    if (signal?.aborted) {
      throw new AIError("ABORTED", "Operation was aborted");
    }

    const options = {
      sourceLanguage: sourceLang ?? "en",
      targetLanguage: targetLang,
    };

    const availability = await Translator.availability(options);
    if (availability === "unavailable") {
      throw new AIError(
        "UNSUPPORTED_LANG",
        `Translation from ${options.sourceLanguage} to ${targetLang} is not supported`,
      );
    }

    const translator = await Translator.create({
      ...options,
      signal,
    });

    const result = await translator.translate(text, { signal });
    translator.destroy();

    // Cache the result
    await setCachedResult(cacheKey, result);

    return result;
  } catch (error) {
    if (error instanceof AIError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === "AbortError" || signal?.aborted) {
        throw new AIError("ABORTED", "Operation was aborted", error);
      }
      throw new AIError(
        "INTERNAL",
        `Translation failed: ${error.message}`,
        error,
      );
    }

    throw new AIError("INTERNAL", "Unknown error during translation", error);
  }
}

/**
 * Clear all caches
 */
export async function clearCache(): Promise<void> {
  memoryCache.clear();

  try {
    if (cacheDB) {
      await cacheDB.clear("results");
    }
  } catch (error) {
    console.warn("Failed to clear cache DB:", error);
  }
}
