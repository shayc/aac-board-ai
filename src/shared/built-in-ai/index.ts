export {
  BuiltInAIError,
  NotReadyError,
  NoUserActivationError,
  UnavailableError,
  UnsupportedError,
} from "./errors.ts";

export { isSupported, type BuiltInAIName } from "./is-supported.ts";

export type { BaseHookReturn, Status } from "./types.ts";

export { useGlobalDownloadProgress } from "./useGlobalDownloadProgress.ts";

export {
  createTranslator,
  type CreateTranslatorOptions,
} from "./translator/create-translator.ts";
export {
  useTranslator,
  type TranslateCallOptions,
  type TranslatorHookReturn,
  type TranslatorOptions,
} from "./translator/useTranslator.ts";

export {
  createRewriter,
  type CreateRewriterOptions,
} from "./rewriter/create-rewriter.ts";
export {
  useRewriter,
  type RewriteCallOptions,
  type RewriterHookReturn,
  type RewriterOptions,
} from "./rewriter/useRewriter.ts";

export {
  createProofreader,
  type CreateProofreaderOptions,
} from "./proofreader/create-proofreader.ts";
export {
  useProofreader,
  type ProofreadCallOptions,
  type ProofreaderHookReturn,
  type ProofreaderOptions,
} from "./proofreader/useProofreader.ts";
