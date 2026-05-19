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

export { useDownloadProgress } from "./hooks/useDownloadProgress.ts";

export { isSupported, type BuiltInAIName } from "./namespaces.ts";

export type { BaseHookReturn, Status } from "./internal/types.ts";

export {
  useRewriter,
  type RewriteCallOptions,
  type RewriterHookReturn,
  type RewriterOptions,
} from "./hooks/useRewriter.ts";

export {
  useTranslator,
  type TranslateCallOptions,
  type TranslatorHookReturn,
  type TranslatorOptions,
} from "./hooks/useTranslator.ts";

export {
  useProofreader,
  type ProofreadCallOptions,
  type ProofreaderHookReturn,
  type ProofreaderOptions,
} from "./hooks/useProofreader.ts";
