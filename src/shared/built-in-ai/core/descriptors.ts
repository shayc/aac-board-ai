import { defineModel } from "./descriptor";
import { bcp47 } from "./locale";

/**
 * Required paired-language config, locale-normalized identity, streaming.
 */
export const translator = defineModel<
  TranslatorCreateOptions,
  TranslatorTranslateOptions,
  string,
  string,
  true
>({
  name: "Translator",
  availabilityArgs: (options) => ({
    sourceLanguage: options.sourceLanguage,
    targetLanguage: options.targetLanguage,
  }),
  identity: (options) => `${options.sourceLanguage}>${options.targetLanguage}`,
  normalize: (options) => ({
    ...options,
    sourceLanguage: bcp47(options.sourceLanguage ?? "en"),
    targetLanguage: bcp47(options.targetLanguage),
  }),
  run: (instance, input, options) =>
    (instance as Translator).translate(input, options),
  stream: (instance, input, options) =>
    (instance as Translator).translateStreaming(input, options),
});

/**
 * Optional enum config + shared/per-call context, streaming.
 */
export const rewriter = defineModel<
  RewriterCreateOptions,
  RewriterRewriteOptions,
  string,
  string,
  true
>({
  name: "Rewriter",
  defaults: { tone: "as-is", format: "as-is", length: "as-is" },
  run: (instance, input, options) =>
    (instance as Rewriter).rewrite(input, options),
  stream: (instance, input, options) =>
    (instance as Rewriter).rewriteStreaming(input, options),
});

/**
 * Structured output, no streaming, no quota.
 */
export const proofreader = defineModel<
  ProofreaderCreateOptions,
  ProofreaderProofreadOptions,
  string,
  ProofreadResult,
  false
>({
  name: "Proofreader",
  defaults: { expectedInputLanguages: ["en"] },
  run: (instance, input, options) =>
    (instance as Proofreader).proofread(input, options),
});
