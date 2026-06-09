import { useAISharedContext } from "@shared/hooks/use-ai-shared-context";
import { useDebouncedValue } from "@shared/hooks/use-debounced-value";
import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useLanguage } from "@shared/language/use-language";
import {
  MissingUserActivationError,
  useGlobalDownloadProgress,
  useProofreader,
  useRewriter,
} from "@shayc/react-built-in-ai";
import { useState } from "react";
import {
  proofreaderLanguageOptions,
  rewriterLanguageOptions,
} from "./engine-language-options";
import { toPhrases } from "./to-phrases";
import { useEngineAvailability } from "./use-engine-availability";

const SHARED_CONTEXT_DEBOUNCE_MS = 400;

export interface UseSuggestionsReturn {
  isSupported: boolean;
  isProofreaderSupported: boolean;
  isRewriterSupported: boolean;
  isPending: boolean;
  isProofreaderPending: boolean;
  isRewriterPending: boolean;
  proofreaderError: Error | undefined;
  rewriterError: Error | undefined;
  downloadProgress: number | null;
  needsActivation: boolean;
  hasFailure: boolean;
  enable: () => void;
  phrases: string[];
  tone: RewriterTone;
  setTone: (tone: RewriterTone) => void;
}

function isRealError(error: Error | undefined): boolean {
  return error !== undefined && error.name !== "AbortError";
}

export function useSuggestions(text: string): UseSuggestionsReturn {
  const sharedContext = useAISharedContext();
  const debouncedSharedContext = useDebouncedValue(
    sharedContext,
    SHARED_CONTEXT_DEBOUNCE_MS,
  );

  const [tone, setTone] = useState<RewriterTone>("as-is");
  const { language } = useLanguage();

  const proofreader = useProofreader(proofreaderLanguageOptions(language));

  const rewriter = useRewriter({
    tone,
    sharedContext: debouncedSharedContext,
    length: "shorter",
    format: "plain-text",
    ...rewriterLanguageOptions(language),
  });

  const isProofreaderSupported = proofreader.status !== "unsupported";
  const isRewriterSupported = rewriter.status !== "unsupported";

  const hasText = text.trim().length > 0;

  const corrected = useLatestAsync({
    enabled: hasText && proofreader.status === "ready",
    deps: [text, language],
    fetch: (signal) =>
      proofreader
        .proofread(text, { signal })
        .then((result) => result.correctedInput),
  });

  const rewritten = useLatestAsync({
    enabled: hasText && rewriter.status === "ready",
    deps: [text, tone, debouncedSharedContext, language],
    fetch: (signal) => rewriter.rewrite(text, { signal }),
  });

  // The global store also sees downloads the onboarding warm-up started, which
  // the hook instances can't. Math.min so the shown percentage never jumps
  // backwards when the faster of two concurrent downloads finishes.
  const proofreaderDownload = useGlobalDownloadProgress("Proofreader");
  const rewriterDownload = useGlobalDownloadProgress("Rewriter");
  const downloadProgress =
    proofreaderDownload !== null && rewriterDownload !== null
      ? Math.min(proofreaderDownload, rewriterDownload)
      : (proofreaderDownload ?? rewriterDownload);
  const isDownloading = downloadProgress !== null;

  const proofreaderAvailability = useEngineAvailability(
    "Proofreader",
    language,
  );
  const rewriterAvailability = useEngineAvailability("Rewriter", language);

  // Idle + downloadable means the lifecycle is parked waiting for the user
  // gesture Chrome requires before a model download.
  const needsActivation =
    (proofreader.status === "idle" &&
      proofreaderAvailability === "downloadable") ||
    (rewriter.status === "idle" && rewriterAvailability === "downloadable") ||
    proofreader.error instanceof MissingUserActivationError ||
    rewriter.error instanceof MissingUserActivationError;

  const isProofreaderBroken =
    isProofreaderSupported &&
    (proofreader.status === "error" ||
      proofreader.status === "unavailable" ||
      isRealError(corrected.error));
  const isRewriterBroken =
    isRewriterSupported &&
    (rewriter.status === "error" ||
      rewriter.status === "unavailable" ||
      isRealError(rewritten.error));

  const phrases = toPhrases(text, [corrected.value, rewritten.value]);

  const isPending = corrected.isPending || rewritten.isPending;

  const proofreaderCannotHelp = !isProofreaderSupported || isProofreaderBroken;
  const rewriterCannotHelp = !isRewriterSupported || isRewriterBroken;

  // Failure is announced only when no supported engine remains operational; a
  // healthy engine that merely had nothing to suggest stays silent.
  const hasFailure =
    hasText &&
    phrases.length === 0 &&
    !isPending &&
    !needsActivation &&
    !isDownloading &&
    (isProofreaderBroken || isRewriterBroken) &&
    proofreaderCannotHelp &&
    rewriterCannotHelp;

  const enable = () => {
    if (proofreader.status !== "ready") {
      void proofreader.prepare().catch(() => undefined);
    }
    if (rewriter.status !== "ready") {
      void rewriter.prepare().catch(() => undefined);
    }
  };

  return {
    isSupported: isProofreaderSupported || isRewriterSupported,
    isProofreaderSupported,
    isRewriterSupported,
    isPending,
    isProofreaderPending: corrected.isPending,
    isRewriterPending: rewritten.isPending,
    proofreaderError: corrected.error,
    rewriterError: rewritten.error,
    downloadProgress,
    needsActivation,
    hasFailure,
    enable,
    phrases,
    tone,
    setTone,
  };
}
