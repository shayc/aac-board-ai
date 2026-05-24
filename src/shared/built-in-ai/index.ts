export {
  BuiltInAIError,
  NotReadyError,
  NoUserActivationError,
  UnavailableError,
  UnsupportedError,
} from "./errors";

export { isSupported, type BuiltInAIName } from "./is-supported";

export type { BaseHookReturn, Status } from "./types";

export { useAISharedContext } from "./use-ai-shared-context";

export { useGlobalDownloadProgress } from "./use-global-download-progress";

export {
  createTranslator,
  type CreateTranslatorOptions,
} from "./translator/create-translator";
export {
  useTranslator,
  type TranslateCallOptions,
  type TranslatorHookReturn,
  type TranslatorOptions,
} from "./translator/use-translator";

export {
  createRewriter,
  type CreateRewriterOptions,
} from "./rewriter/create-rewriter";
export {
  useRewriter,
  type RewriteCallOptions,
  type RewriterHookReturn,
  type RewriterOptions,
} from "./rewriter/use-rewriter";

export {
  createProofreader,
  type CreateProofreaderOptions,
} from "./proofreader/create-proofreader";
export {
  useProofreader,
  type ProofreadCallOptions,
  type ProofreaderHookReturn,
  type ProofreaderOptions,
} from "./proofreader/use-proofreader";
