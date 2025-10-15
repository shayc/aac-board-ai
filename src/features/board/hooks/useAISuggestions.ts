import { useProofreader } from "@/shared/hooks/ai/useProofreader";
import { useRewriter } from "@/shared/hooks/ai/useRewriter";
import { useTranslator } from "@/shared/hooks/ai/useTranslator";
import { useWriter } from "@/shared/hooks/ai/useWriter";
import type { BoardButton } from "@features/board/types";
import { useEffect, useState } from "react";
import type { MessagePart } from "./useMessage";

export interface UseAISuggestionsOptions {
  words: MessagePart[];
  boardButtons?: BoardButton[];
}

export type ToneOption = "neutral" | "formal" | "casual";

export function useAISuggestions(options: UseAISuggestionsOptions) {
  const { words, boardButtons = [] } = options;
  const proofreader = useProofreader();
  const writer = useWriter();
  const rewriter = useRewriter();
  const translator = useTranslator();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [tone, setTone] = useState<ToneOption>("neutral");
  const [isGenerating, setIsGenerating] = useState(false);

  const [proofreaderInstance, setProofreaderInstance] =
    useState<Proofreader | null>(null);
  const [writerInstance, setWriterInstance] = useState<Writer | null>(null);
  const [rewriterInstance, setRewriterInstance] = useState<Rewriter | null>(
    null
  );
  const [translatorInstance, setTranslatorInstance] =
    useState<Translator | null>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle");

  // Build board vocabulary context for Writer
  const boardVocabulary = boardButtons
    .map((btn) => btn.label)
    .filter(Boolean)
    .join(", ");

  const boardContextString = boardVocabulary
    ? `You are helping with AAC communication. Available vocabulary: ${boardVocabulary}. When given a partial sentence, add ONLY the next word to complete it naturally. Do not rewrite or expand the sentence - just add the missing words.`
    : "You are helping with AAC communication. When given a partial sentence, add ONLY the next word to complete it naturally. Do not rewrite or expand - just add the missing words.";

  const initializeInstances = async () => {
    try {
      const [
        proofreaderSession,
        writerSession,
        rewriterSession,
        translatorSession,
      ] = await Promise.all([
        proofreader.create({ expectedInputLanguages: ["en"] }),
        writer.create({
          sharedContext: boardContextString,
          tone: "neutral",
          length: "short",
        }),
        rewriter.create(),
        translator.create({ sourceLanguage: "en", targetLanguage: "he" }),
      ]);

      setProofreaderInstance(proofreaderSession);
      setWriterInstance(writerSession);
      setRewriterInstance(rewriterSession);
      setTranslatorInstance(translatorSession);
      setStatus(
        proofreaderSession &&
          writerSession &&
          rewriterSession &&
          translatorSession
          ? "ready"
          : "error"
      );
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

    if (
      !sentence ||
      !proofreaderInstance ||
      !writerInstance ||
      !rewriterInstance ||
      !translatorInstance
    ) {
      setSuggestions([]);
      return;
    }

    setIsGenerating(true);

    try {
      // STEP 1: Proofreading - Fix grammar and spelling
      const proofreadResult = await proofreaderInstance.proofread(sentence);
      const correctedText = proofreadResult.correctedInput;

      // STEP 2: Writer - Suggest 1-2 word completion using board context

      // Get Writer output
      const writerOutput = await writerInstance.write(correctedText);

      // Extract only the new words added (max 2 words)
      // If Writer rewrote the entire sentence, extract what was added after the original
      let completedText = correctedText;

      if (writerOutput.toLowerCase().startsWith(correctedText.toLowerCase())) {
        // Writer appended to the sentence - extract the addition
        const addition = writerOutput.slice(correctedText.length).trim();
        const addedWords = addition.split(/\s+/).slice(0, 2); // Take max 2 words
        completedText =
          correctedText +
          (addedWords.length > 0 ? " " + addedWords.join(" ") : "");
      } else {
        // Writer rewrote the sentence - try to find common ending and extract new words
        const writerWords = writerOutput.split(/\s+/);
        const originalWords = correctedText.split(/\s+/);

        // Take last 1-2 words from writer output that weren't in original
        const newWords = writerWords
          .slice(-2)
          .filter(
            (word) =>
              !originalWords.some(
                (origWord) => origWord.toLowerCase() === word.toLowerCase()
              )
          );

        if (newWords.length > 0) {
          completedText = correctedText + " " + newWords.join(" ");
        }
      }

      // STEP 3: Rewriter - Generate tone variations
      // const toneMapping: Record<
      //   ToneOption,
      //   "as-is" | "more-formal" | "more-casual"
      // > = {
      //   neutral: "as-is",
      //   formal: "more-formal",
      //   casual: "more-casual",
      // };

      // const CONTEXT_REQUEST =
      //   "You are rewriting a short AAC-style message into a clear, polite REQUEST. " +
      //   "Preserve the user's meaning and key content words without adding new information. " +
      //   "Fix only essential grammar (articles, 'to', 'am', 'is'). " +
      //   "Keep it short (max 10 words) and natural for spoken English. " +
      //   "Prefer patterns like 'I want …', 'Please …', or 'Can I …, please?'. " +
      //   "No emojis, no translation, no extra details.";

      // const CONTEXT_DESCRIBE =
      //   "Rewrite the AAC-style message as a natural DESCRIPTION or COMMENT. " +
      //   "Keep the same meaning and key content words, but correct grammar and flow. " +
      //   "Do not ask for anything or give commands. " +
      //   "Use simple, present-tense phrasing such as 'I am …', 'I like …', or 'It is …'. " +
      //   "One sentence, under 10 words. No emojis, no translation.";

      // const CONTEXT_SOCIAL =
      //   "Rewrite the AAC-style message as a friendly SOCIAL remark. " +
      //   "Keep the user's meaning and content words, but add warmth or courtesy. " +
      //   "Do not turn it into a request. " +
      //   "Use natural human tone such as 'That sounds nice', 'Thank you', or 'That's good.'. " +
      //   "One short sentence, under 10 words. No emojis, no translation.";

      // const [rewrittenRequest, rewrittenDescribe, rewrittenSocial] =
      //   await Promise.all([
      //     rewriterInstance.rewrite(completedText, {
      //       context: CONTEXT_REQUEST,
      //       tone: toneMapping[tone],
      //     }),
      //     rewriterInstance.rewrite(completedText, {
      //       context: CONTEXT_DESCRIBE,
      //       tone: toneMapping[tone],
      //     }),
      //     rewriterInstance.rewrite(completedText, {
      //       context: CONTEXT_SOCIAL,
      //       tone: toneMapping[tone],
      //     }),
      //   ]);

      // // STEP 4: Translation - Apply only to final outputs
      // const [translatedRequest, translatedDescribe, translatedSocial] =
      //   await Promise.all([
      //     translatorInstance.translate(rewrittenRequest),
      //     translatorInstance.translate(rewrittenDescribe),
      //     translatorInstance.translate(rewrittenSocial),
      //   ]);

      setSuggestions([writerOutput]);
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

  // Reinitialize Writer when board context changes
  useEffect(() => {
    const updateWriterContext = async () => {
      if (status === "ready" && boardButtons.length > 0) {
        try {
          const newWriter = await writer.create({
            sharedContext: boardContextString,
            tone: "neutral",
            length: "short",
          });

          setWriterInstance(newWriter);
        } catch (error) {
          console.error("Failed to update Writer context:", error);
        }
      }
    };

    void updateWriterContext();
  }, [boardButtons]);

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
