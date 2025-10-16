// chrome-builtin-ai.d.ts
// Ambient TypeScript declarations for Chrome’s Built-in AI task APIs.
//
// Sources (Chrome official):
// • Translator API — https://developer.chrome.com/docs/ai/translator-api  (Last updated 2025-05-20)
// • Language Detector API — https://developer.chrome.com/docs/ai/language-detection  (Last updated 2024-09-24)
// • Rewriter API — https://developer.chrome.com/docs/ai/rewriter-api  (Last updated 2025-05-20)
// • Writer API — https://developer.chrome.com/docs/ai/writer-api  (Last updated 2025-05-20)
// • Proofreader API — https://developer.chrome.com/docs/ai/proofreader-api  (Last updated 2025-09-12)
//
// Notes:
// • All classes are exposed as globals (no import required).
// • Call `.availability()` first to check model state, then `.create()` inside a user gesture if a download is needed.
// • To observe download progress, either pass `monitor(m => m.addEventListener('downloadprogress', …))` to `create()`,
//   or (where documented) add a `'downloadprogress'` listener on the created instance.
// • Default availability: top-level window or same-origin iframe; delegate to cross-origin iframes via
//   <iframe allow="translator; language-detector; rewriter; writer; proofreader"> (Permissions Policy).
// • Not available in Web Workers (per docs).
// • This file intentionally excludes explainer-only or MDN-only fields (e.g. quotas, toggles).
// • Translator availability note: Chrome intentionally hides per-language-pair download status; many pairs
//   appear “downloadable” until a site actually creates that pair.

export {};

declare global {
  // -------------------------------------------------------------------------------------------------
  // Shared primitives
  // -------------------------------------------------------------------------------------------------

  /** Availability states returned by `.availability()`. */
  type AIAvailability = "available" | "downloadable" | "unavailable";

  /** Progress event fired while an on-device model or language pack downloads. */
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
      listener: (ev: AIDownloadProgressEvent) => void,
      options?: boolean | AddEventListenerOptions
    ): void;
  }

  /** Common `create()` options shared across APIs. */
  interface AIBaseCreateOptions {
    /** Abort creation (and any pending download). */
    signal?: AbortSignal;
    /**
     * Observe download progress before the instance becomes ready.
     * Chrome examples pass a monitor that exposes `addEventListener('downloadprogress', ...)`.
     */
    monitor?(monitor: EventTarget): void;
  }

  // -------------------------------------------------------------------------------------------------
  // Translator API — https://developer.chrome.com/docs/ai/translator-api
  // Permission-Policy: `allow="translator"`; not available in Web Workers.
  // Note: per Chrome docs, per-language-pair download status is intentionally hidden.
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
   * Chrome docs show both `translate()` and streaming `translateStreaming()`.
   */
  interface Translator {
    /** Translate the full input string. */
    translate(
      input: string,
      options?: TranslatorTranslateOptions
    ): Promise<string>;

    /**
     * Translate long text as a stream of chunks.
     * Example: `for await (const chunk of translator.translateStreaming(text)) { … }`
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
  const Translator: TranslatorConstructor;

  // -------------------------------------------------------------------------------------------------
  // Language Detector API — https://developer.chrome.com/docs/ai/language-detection
  // Permission-Policy: `allow="language-detector"`; not available in Web Workers.
  // -------------------------------------------------------------------------------------------------

  /** Create options: only base options (signal/monitor) are currently documented. */
  type LanguageDetectorCreateOptions = AIBaseCreateOptions;

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

  /** LanguageDetector ranks likely languages for input text. */
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
  const LanguageDetector: LanguageDetectorConstructor;

  // -------------------------------------------------------------------------------------------------
  // Rewriter API — https://developer.chrome.com/docs/ai/rewriter-api
  // Permission-Policy: `allow="rewriter"`; not available in Web Workers.
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
    /** Optional per-call tone override. */
    tone?: RewriterTone;
    /** Abort an ongoing rewrite or streaming rewrite. */
    signal?: AbortSignal;
  }

  /**
   * Rewriter: revises text according to tone/format/length.
   * Supports both non-streaming `rewrite()` and streaming `rewriteStreaming()`.
   * Instances are EventTargets and fire `'downloadprogress'` during model fetch.
   */
  interface Rewriter extends EventTarget {
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
  const Rewriter: RewriterConstructor;

  // -------------------------------------------------------------------------------------------------
  // Writer API — https://developer.chrome.com/docs/ai/writer-api
  // Permission-Policy: `allow="writer"`; not available in Web Workers.
  // -------------------------------------------------------------------------------------------------

  /** Writing tone for generated content. Default is "neutral". */
  type WriterTone = "formal" | "neutral" | "casual";

  /** Output format for generated content. Default is "markdown". */
  type WriterFormat = "markdown" | "plain-text";

  /** Target length of generated content. Default is "medium". */
  type WriterLength = "short" | "medium" | "long";

  interface WriterCreateOptions extends AIBaseCreateOptions {
    /**
     * Shared context applied to all writes from this instance,
     * e.g. “This is an email to acquaintances about an upcoming event.”
     */
    sharedContext?: string;
    /** Overall tone for outputs ("neutral" by default). */
    tone?: WriterTone;
    /** Output formatting ("markdown" by default). */
    format?: WriterFormat;
    /** Desired length ("medium" by default). */
    length?: WriterLength;
  }

  interface WriterWriteOptions {
    /** Per-call background information to steer the output. */
    context?: string;
    /** Abort an ongoing write or streaming write. */
    signal?: AbortSignal;
  }

  /**
   * Writer: generates new content from a prompt, optionally guided by shared/per-call context.
   * Supports both non-streaming `write()` and streaming `writeStreaming()`.
   * Progress for initial model download is observed via `create({ monitor(...) })`.
   */
  interface Writer {
    /** Generate the full output in one result. */
    write(input: string, options?: WriterWriteOptions): Promise<string>;

    /** Generate output as a stream of text chunks. */
    writeStreaming(
      input: string,
      options?: WriterWriteOptions
    ): AsyncIterable<string>;

    /** Free resources for this instance. */
    destroy(): void;
  }

  interface WriterConstructor {
    /** Check whether the writer model is ready, downloadable, or unavailable. */
    availability(): Promise<AIAvailability>;

    /**
     * Create a Writer instance; if the model must be downloaded, call from a user gesture
     * and pass `monitor(m => m.addEventListener('downloadprogress', ...))` to show progress.
     */
    create(options?: WriterCreateOptions): Promise<Writer>;
  }

  /** Global Writer constructor. */
  const Writer: WriterConstructor;

  // -------------------------------------------------------------------------------------------------
  // Proofreader API — https://developer.chrome.com/docs/ai/proofreader-api
  // Permission-Policy: `allow="proofreader"`; not available in Web Workers.
  // Notes: Explainer toggles `includeCorrectionTypes` and `includeCorrectionExplanation`
  //        are not supported per Chrome docs (localized pages call this out).
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
    /** Fully corrected version of the input. */
    correctedInput: string;
    /** List of corrections anchored to original indices. */
    corrections: ProofreadCorrection[];
  }

  /** Proofreader: corrects grammar, spelling, and punctuation. */
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
    availability(options?: ProofreaderCreateOptions): Promise<AIAvailability>;
    /** Create a Proofreader; call from a user gesture if download is required. */
    create(options?: ProofreaderCreateOptions): Promise<Proofreader>;
  }

  /** Global Proofreader constructor. */
  const Proofreader: ProofreaderConstructor;
}
