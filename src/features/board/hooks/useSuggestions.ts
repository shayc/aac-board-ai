import { useEffect, useState } from "react";
import { useProofreader } from "../../../ai/hooks/useProofreader";
import { useRewriter } from "../../../ai/hooks/useRewriter";
import type { SentenceContent } from "../CommunicationBoard/types";

export interface UseSuggestionsOptions {
  words: SentenceContent[];
}

export type ToneOption = "neutral" | "formal" | "casual";

/**
 * Standalone hook for managing AI-powered suggestions.
 * Uses the proofreader API to correct text and rewriter API to adjust tone.
 */
export function useSuggestions(options: UseSuggestionsOptions) {
  const { words } = options;
  const proofreader = useProofreader();
  const rewriter = useRewriter();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [tone, setTone] = useState<ToneOption>("neutral");
  const [isGenerating, setIsGenerating] = useState(false);
  const [proofreaderInstance, setProofreaderInstance] =
    useState<ProofreaderInstance | null>(null);
  const [rewriterInstance, setRewriterInstance] =
    useState<RewriterInstance | null>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");

  const initializeInstances = async () => {
    try {
      const [proofreaderSession, rewriterSession] = await Promise.all([
        proofreader.create({ expectedInputLanguages: ["en"] }),
        rewriter.create(),
      ]);

      setProofreaderInstance(proofreaderSession);
      setRewriterInstance(rewriterSession);
      setStatus(proofreaderSession && rewriterSession ? "ready" : "error");
    } catch (error) {
      console.error("Failed to initialize AI instances:", error);
      setStatus("error");
    }
  };

  const requestSession = async () => {
    await initializeInstances();
  };

  const generateSuggestions = async () => {
    const sentence = words.map((word) => word.label).join(" ");

    if (!sentence || !proofreaderInstance || !rewriterInstance) {
      setSuggestions([]);
      return;
    }

    setIsGenerating(true);

    try {
      const proofreadResult = await proofreaderInstance.proofread(sentence);
      const correctedText = proofreadResult.correctedInput;

      const toneMapping: Record<
        ToneOption,
        "as-is" | "more-formal" | "more-casual"
      > = {
        neutral: "as-is",
        formal: "more-formal",
        casual: "more-casual",
      };

      const rewrittenText = await rewriterInstance.rewrite(correctedText, {
        tone: toneMapping[tone],
      });
      console.log("Proofread result:", proofreadResult);
      console.log("Rewritten text:", rewrittenText);
      setSuggestions([rewrittenText]);
    } catch (error) {
      console.error("Failed to generate suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerate = () => {
    void generateSuggestions();
  };

  const changeTone = (newTone: ToneOption) => {
    setTone(newTone);
  };

  useEffect(() => {
    if (status === "ready") {
      void generateSuggestions();
    }
  }, [words, tone, status]);

  return {
    suggestions,
    tone,
    isGenerating,
    status,
    changeTone,
    regenerate,
    requestSession,
  };
}
