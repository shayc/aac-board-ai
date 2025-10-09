// chrome-builtin-ai.d.ts
// Ambient TypeScript declarations for Chrome’s Built-in AI task APIs.
//
// Sources (Chrome official):
// • Translator API — https://developer.chrome.com/docs/ai/translator-api  (Updated 2025-05-20)
// • Language Detector API — https://developer.chrome.com/docs/ai/language-detection  (Updated 2025-05-20)
// • Rewriter API — https://developer.chrome.com/docs/ai/rewriter-api  (Updated 2025-05-20)
// • Proofreader API — https://developer.chrome.com/docs/ai/proofreader-api  (Updated 2025-09-12)
//
// Notes:
// • All classes are exposed as globals (no import required).
// • Call `.availability()` first to check model state, then `.create()` inside a user gesture if a download is needed.
// • Pass `monitor(m => m.addEventListener('downloadprogress', …))` to observe download progress.
// • Default availability: top-level window or same-origin iframe; delegate to cross-origin iframes with
//     <iframe allow="translator; language-detector; rewriter; proofreader">
// • Not available in Web Workers (explicitly noted in Chrome docs).
// • This file intentionally excludes explainer-only or MDN-only fields (e.g. quotas, toggles).

// -------------------------------------------------------------------------------------------------
// Shared primitives
// -------------------------------------------------------------------------------------------------

/**
 * Availability states returned by `.availability()`.
 * Chrome pages show: "available" | "downloadable" | "unavailable".
 */
type AIAvailability = "available" | "downloadable" | "unavailable";

/**
 * Progress event fired while an on-device model or language pack downloads.
 * Chrome examples read `e.loaded` and occasionally `e.total`.
 */
interface AIDownloadProgressEvent extends Event {
  /** Fraction 0 … 1 downloaded. */
  readonly loaded: number;
  /** Optional total bytes. */
  readonly total?: number;
}

/** Extend EventTarget with a typed `'downloadprogress'` event. */
interface EventTarget {
  addEventListener(
    type: "downloadprogress",
    listener: (ev: AIDownloadProgressEvent) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
}

/** Common `create()` options shared across APIs. */
interface AIBaseCreateOptions {
  /** Abort creation (and any pending download). */
  signal?: AbortSignal;
  /** Observe download progress before the instance becomes ready. */
  monitor?(monitor: EventTarget): void;
}

// -------------------------------------------------------------------------------------------------
// Translator API — https://developer.chrome.com/docs/ai/translator-api
// -------------------------------------------------------------------------------------------------

interface TranslatorCreateOptions extends AIBaseCreateOptions {
  /** BCP-47 code of the input language, e.g. `"es"`. Optional. */
  sourceLanguage?: string;
  /** BCP-47 code of the target language, e.g. `"fr"`. Required. */
  targetLanguage: string;
}

interface TranslatorTranslateOptions {
  /** Abort an ongoing translation. */
  signal?: AbortSignal;
}

/**
 * Translator: performs client-side translation using on-device models.
 * Chrome examples show both `translate()` and streaming `translateStreaming()`.
 * Permission-Policy: `allow="translator"`.
 * Not available in Web Workers.
 */
interface Translator {
  /** Translate the full input string. */
  translate(
    input: string,
    options?: TranslatorTranslateOptions
  ): Promise<string>;

  /**
   * Translate long text as a stream of chunks.
   * Chrome docs: `for await (const chunk of translator.translateStreaming(text)) { … }`
   */
  translateStreaming(
    input: string,
    options?: TranslatorTranslateOptions
  ): AsyncIterable<string>;

  /** Free resources for this instance. */
  destroy(): void;
}

interface TranslatorConstructor {
  /** Check whether a (source,target) pair is ready, downloadable, or unavailable. */
  availability(options: TranslatorCreateOptions): Promise<AIAvailability>;
  /** Create a Translator; call from a user gesture if download is required. */
  create(options: TranslatorCreateOptions): Promise<Translator>;
}

/** Global Translator constructor. */
declare var Translator: TranslatorConstructor;

// -------------------------------------------------------------------------------------------------
// Language Detector API — https://developer.chrome.com/docs/ai/language-detection
// -------------------------------------------------------------------------------------------------

interface LanguageDetectorCreateOptions extends AIBaseCreateOptions {}

interface LanguageDetectorDetectOptions {
  /** Abort an ongoing detection. */
  signal?: AbortSignal;
}

/** Ranked language candidate returned by `detect()`. */
interface LanguageDetectionCandidate {
  /** Detected BCP-47 tag, e.g. `"de"`, `"en-US"`. */
  detectedLanguage: string;
  /** Confidence score in [0.0, 1.0]. */
  confidence: number;
}

/**
 * LanguageDetector: ranks likely languages for input text.
 * Permission-Policy: `allow="language-detector"`.
 * Not available in Web Workers.
 */
interface LanguageDetector {
  /** Detect likely languages for `input`. */
  detect(
    input: string,
    options?: LanguageDetectorDetectOptions
  ): Promise<LanguageDetectionCandidate[]>;

  /** Free resources for this instance. */
  destroy(): void;
}

interface LanguageDetectorConstructor {
  /** Check whether detection is ready, downloadable, or unavailable. */
  availability(
    options?: LanguageDetectorCreateOptions
  ): Promise<AIAvailability>;
  /** Create a LanguageDetector; call from a user gesture if download is required. */
  create(options?: LanguageDetectorCreateOptions): Promise<LanguageDetector>;
}

/** Global LanguageDetector constructor. */
declare var LanguageDetector: LanguageDetectorConstructor;

// -------------------------------------------------------------------------------------------------
// Rewriter API — https://developer.chrome.com/docs/ai/rewriter-api
// -------------------------------------------------------------------------------------------------

type RewriterTone = "more-formal" | "as-is" | "more-casual";
type RewriterFormat = "as-is" | "markdown" | "plain-text";
type RewriterLength = "shorter" | "as-is" | "longer";

interface RewriterCreateOptions extends AIBaseCreateOptions {
  tone?: RewriterTone;
  format?: RewriterFormat;
  length?: RewriterLength;
  /**
   * Shared context applied to all rewrites from this instance,
   * e.g. “Support replies should be polite and concise.”
   */
  sharedContext?: string;
}

interface RewriterRewriteOptions {
  /** Per-call context to steer rewriting. */
  context?: string;
  /** Optional per-call tone override (shown in Chrome example). */
  tone?: RewriterTone;
  /** Abort an ongoing rewrite or streaming rewrite. */
  signal?: AbortSignal;
}

/**
 * Rewriter: revises text according to tone/format/length.
 * Chrome shows both `rewrite()` and `rewriteStreaming()`.
 * Permission-Policy: `allow="rewriter"`.
 * Not available in Web Workers.
 */
interface Rewriter {
  /** Rewrite text and return the full result. */
  rewrite(input: string, options?: RewriterRewriteOptions): Promise<string>;

  /** Stream rewritten text as generated. */
  rewriteStreaming(
    input: string,
    options?: RewriterRewriteOptions
  ): AsyncIterable<string>;

  /** Free resources for this instance. */
  destroy(): void;
}

interface RewriterConstructor {
  /** Check whether rewriting is ready, downloadable, or unavailable. */
  availability(options?: RewriterCreateOptions): Promise<AIAvailability>;
  /** Create a Rewriter; call from a user gesture if download is required. */
  create(options?: RewriterCreateOptions): Promise<Rewriter>;
}

/** Global Rewriter constructor. */
declare var Rewriter: RewriterConstructor;

// -------------------------------------------------------------------------------------------------
// Proofreader API — https://developer.chrome.com/docs/ai/proofreader-api
// -------------------------------------------------------------------------------------------------

interface ProofreaderCreateOptions extends AIBaseCreateOptions {
  /** Array of expected input languages, e.g. `["en"]`. */
  expectedInputLanguages?: string[];
}

interface ProofreaderProofreadOptions {
  /** Abort an ongoing proofread. */
  signal?: AbortSignal;
}

/** One correction span in the original input. */
interface ProofreadCorrection {
  startIndex: number;
  endIndex: number;
  correction: string;
}

/** Result returned by `proofread()`. */
interface ProofreadResult {
  /**
   * Fully corrected version of the input.
   * Chrome docs call this property `corrected`.
   */
  corrected: string;
  /** List of corrections anchored to original indices. */
  corrections: ProofreadCorrection[];
}

/**
 * Proofreader: corrects grammar, spelling, and punctuation.
 * Explainer toggles (`includeCorrectionTypes`, `includeCorrectionExplanation`)
 * are NOT supported per Chrome docs.
 * Permission-Policy: `allow="proofreader"`.
 * Not available in Web Workers.
 */
interface Proofreader {
  /** Proofread text and return corrections. */
  proofread(
    input: string,
    options?: ProofreaderProofreadOptions
  ): Promise<ProofreadResult>;
  /** Free resources for this instance. */
  destroy(): void;
}

interface ProofreaderConstructor {
  /** Check whether proofreading is ready, downloadable, or unavailable. */
  availability(options?: {
    expectedInputLanguages?: string[];
  }): Promise<AIAvailability>;
  /** Create a Proofreader; call from a user gesture if download is required. */
  create(options?: ProofreaderCreateOptions): Promise<Proofreader>;
}

/** Global Proofreader constructor. */
declare var Proofreader: ProofreaderConstructor;

export {};
