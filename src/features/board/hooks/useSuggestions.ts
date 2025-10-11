import type { SentenceContent } from "@features/board/types";
import { useProofreader } from "@shared/ai/hooks/useProofreader";
import { useRewriter } from "@shared/ai/hooks/useRewriter";
import { useEffect, useState } from "react";

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
    useState<Proofreader | null>(null);
  const [rewriterInstance, setRewriterInstance] = useState<Rewriter | null>(
    null
  );
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

      const CONTEXT_REQUEST =
        "You are rewriting a short AAC-style message into a clear, polite REQUEST. " +
        "Preserve the user’s meaning and key content words without adding new information. " +
        "Fix only essential grammar (articles, 'to', 'am', 'is'). " +
        "Keep it short (max 10 words) and natural for spoken English. " +
        "Prefer patterns like 'I want …', 'Please …', or 'Can I …, please?'. " +
        "No emojis, no translation, no extra details.";

      const CONTEXT_DESCRIBE =
        "Rewrite the AAC-style message as a natural DESCRIPTION or COMMENT. " +
        "Keep the same meaning and key content words, but correct grammar and flow. " +
        "Do not ask for anything or give commands. " +
        "Use simple, present-tense phrasing such as 'I am …', 'I like …', or 'It is …'. " +
        "One sentence, under 10 words. No emojis, no translation.";

      const CONTEXT_SOCIAL =
        "Rewrite the AAC-style message as a friendly SOCIAL remark. " +
        "Keep the user’s meaning and content words, but add warmth or courtesy. " +
        "Do not turn it into a request. " +
        "Use natural human tone such as 'That sounds nice', 'Thank you', or 'That’s good.'. " +
        "One short sentence, under 10 words. No emojis, no translation.";

      const rewrittenRequest = await rewriterInstance.rewrite(correctedText, {
        context: CONTEXT_REQUEST,
        tone: toneMapping[tone],
      });

      const rewrittenDescribe = await rewriterInstance.rewrite(correctedText, {
        context: CONTEXT_DESCRIBE,
        tone: toneMapping[tone],
      });

      const rewrittenSocial = await rewriterInstance.rewrite(correctedText, {
        context: CONTEXT_SOCIAL,
        tone: toneMapping[tone],
      });

      console.log("Proofread result:", correctedText);
      console.log("Rewritten text (request):", rewrittenRequest);
      console.log("Rewritten text (describe):", rewrittenDescribe);
      console.log("Rewritten text (social):", rewrittenSocial);

      setSuggestions([rewrittenRequest, rewrittenDescribe, rewrittenSocial]);
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
