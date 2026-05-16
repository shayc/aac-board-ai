import { proofreader, rewriter, translator } from "../core/descriptors";
import { useBuiltInAI } from "./useBuiltInAI";

export const useTranslator = (options: TranslatorCreateOptions) =>
  useBuiltInAI(translator, options);

export const useRewriter = (options: RewriterCreateOptions = {}) =>
  useBuiltInAI(rewriter, options);

export const useProofreader = (options: ProofreaderCreateOptions = {}) =>
  useBuiltInAI(proofreader, options);
