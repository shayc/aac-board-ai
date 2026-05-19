export {
  BuiltInAIError,
  NotReadyError,
  NoUserActivationError,
  UnavailableError,
  UnsupportedError,
} from "./errors.ts";

export { isSupported, type BuiltInAIName } from "./is-supported.ts";

export type { BaseHookReturn, Status } from "./internal/types.ts";

export { useGlobalDownloadProgress } from "./internal/useGlobalDownloadProgress.ts";

export {
  createTranslator,
  type CreateTranslatorOptions,
  useTranslator,
  type TranslateCallOptions,
  type TranslatorHookReturn,
  type TranslatorOptions,
} from "./translator/index.ts";

export {
  createRewriter,
  type CreateRewriterOptions,
  useRewriter,
  type RewriteCallOptions,
  type RewriterHookReturn,
  type RewriterOptions,
} from "./rewriter/index.ts";

export {
  createProofreader,
  type CreateProofreaderOptions,
  useProofreader,
  type ProofreadCallOptions,
  type ProofreaderHookReturn,
  type ProofreaderOptions,
} from "./proofreader/index.ts";
