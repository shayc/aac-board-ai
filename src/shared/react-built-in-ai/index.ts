export {
  BuiltInAIError,
  NoUserActivationError,
  NotReadyError,
  UnavailableError,
  UnsupportedError,
} from "./errors.ts";

export type { BaseHookReturn, Status } from "./internal/types.ts";

export {
  useSummarizer,
  type SummarizeCallOptions,
  type SummarizerHookReturn,
  type SummarizerOptions,
} from "./hooks/use-summarizer.ts";

export {
  useWriter,
  type WriteCallOptions,
  type WriterHookReturn,
  type WriterOptions,
} from "./hooks/use-writer.ts";

export {
  useRewriter,
  type RewriteCallOptions,
  type RewriterHookReturn,
  type RewriterOptions,
} from "./hooks/use-rewriter.ts";

export {
  useTranslator,
  type TranslateCallOptions,
  type TranslatorHookReturn,
  type TranslatorOptions,
} from "./hooks/use-translator.ts";

export {
  useLanguageDetector,
  type DetectCallOptions,
  type LanguageDetectionResult,
  type LanguageDetectorHookReturn,
  type LanguageDetectorOptions,
} from "./hooks/use-language-detector.ts";

export {
  useProofreader,
  type CorrectionType,
  type ProofreadCallOptions,
  type ProofreadCorrection,
  type ProofreadResult,
  type ProofreaderHookReturn,
  type ProofreaderOptions,
} from "./hooks/use-proofreader.ts";
