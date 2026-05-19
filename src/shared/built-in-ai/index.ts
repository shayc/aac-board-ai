export {
  BuiltInAIError,
  NotReadyError,
  NoUserActivationError,
  UnavailableError,
  UnsupportedError,
} from "./errors.ts";

export {
  createTranslator,
  type CreateTranslatorOptions,
} from "./create-translator.ts";

export { useDownloadProgress } from "./useDownloadProgress.ts";

export { isSupported, type BuiltInAIName } from "./is-supported.ts";

export type { BaseHookReturn, Status } from "./lifecycle/types.ts";

export {
  useRewriter,
  type RewriteCallOptions,
  type RewriterHookReturn,
  type RewriterOptions,
} from "./useRewriter.ts";

export {
  useTranslator,
  type TranslateCallOptions,
  type TranslatorHookReturn,
  type TranslatorOptions,
} from "./useTranslator.ts";

export {
  useProofreader,
  type ProofreadCallOptions,
  type ProofreaderHookReturn,
  type ProofreaderOptions,
} from "./useProofreader.ts";
