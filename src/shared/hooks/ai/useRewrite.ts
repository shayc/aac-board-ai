import { useEffect, useRef, useState } from "react";
import { useAI } from "@shared/contexts/AIProvider/useAI";
import { isRewriterSupported } from "./ai-capabilities";

export interface UseRewriteOptions {
  tone?: RewriterTone;
  sharedContext?: string;
}

export interface UseRewriteReturn {
  data: string | null;
  isLoading: boolean;
  error: Error | null;
  isSupported: boolean;
}

interface RewriteState {
  data: string | null;
  isLoading: boolean;
  error: Error | null;
}

const idleState: RewriteState = {
  data: null,
  isLoading: false,
  error: null,
};

export function useRewrite(
  text: string,
  options?: UseRewriteOptions,
): UseRewriteReturn {
  const { setDownload } = useAI();
  const rewriterRef = useRef<Rewriter | null>(null);
  const optionsRef = useRef<UseRewriteOptions | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const tone = options?.tone ?? "as-is";
  const sharedContext = options?.sharedContext;

  const hasInput = isRewriterSupported && !!text.trim();

  const [state, setState] = useState<RewriteState>(idleState);

  useEffect(() => {
    if (!hasInput) {
      return;
    }

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    const ensureInstance = async (): Promise<Rewriter | null> => {
      const canReuse =
        rewriterRef.current &&
        optionsRef.current?.tone === tone &&
        optionsRef.current?.sharedContext === sharedContext;

      if (canReuse) {
        return rewriterRef.current;
      }

      const availability = await Rewriter.availability();

      if (signal.aborted || availability === "unavailable") {
        return null;
      }

      // The Rewriter API may not expose destroy() in all browsers.
      rewriterRef.current?.destroy?.();

      const rewriter = await Rewriter.create({
        tone,
        sharedContext,
        length: "shorter",
        format: "plain-text",
        monitor(m) {
          m.addEventListener("downloadprogress", (event) => {
            setDownload("rewriter", event.loaded);
          });
        },
      });

      if (signal.aborted) {
        return null;
      }

      rewriterRef.current = rewriter;
      optionsRef.current = { tone, sharedContext };
      return rewriter;
    };

    const run = async () => {
      setState({ data: null, isLoading: true, error: null });

      try {
        const rewriter = await ensureInstance();

        if (!rewriter) {
          setState(idleState);
          return;
        }

        const result = await rewriter.rewrite(text, { signal });

        if (signal.aborted) {
          return;
        }

        setState({ data: result, isLoading: false, error: null });
      } catch (err) {
        if ((err as DOMException).name === "AbortError") {
          return;
        }

        setState({ data: null, isLoading: false, error: err as Error });
      }
    };

    void run();

    return () => {
      abortRef.current?.abort();
    };
  }, [hasInput, text, tone, sharedContext, setDownload]);

  const { data, isLoading, error } = hasInput ? state : idleState;

  return {
    data,
    isLoading,
    error,
    isSupported: isRewriterSupported,
  };
}
