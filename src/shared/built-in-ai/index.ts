export { defineModel, type BuiltInAIModel } from "./core/descriptor";
export { proofreader, rewriter, translator } from "./core/descriptors";
export { BuiltInAIUnavailableError } from "./core/errors";
export type { BuiltInAIHandle } from "./core/registry";
export type { AvailabilityState, BuiltInAIStatus } from "./core/types";
export { useBuiltInAI, type UseBuiltInAIResult } from "./react/useBuiltInAI";
export { useProofreader, useRewriter, useTranslator } from "./react/presets";
