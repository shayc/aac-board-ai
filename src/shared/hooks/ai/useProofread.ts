import { useEffect, useRef, useState } from "react";
import { useAI } from "@shared/contexts/AIProvider/useAI";
import { isProofreaderSupported } from "./ai-capabilities";

export interface UseProofreadReturn {
  data: string | null;
  isLoading: boolean;
  error: Error | null;
  isSupported: boolean;
}

interface ProofreadState {
  data: string | null;
  isLoading: boolean;
  error: Error | null;
}

const idleState: ProofreadState = {
  data: null,
  isLoading: false,
  error: null,
};

export function useProofread(text: string): UseProofreadReturn {
  const { setDownload } = useAI();
  const proofreaderRef = useRef<Proofreader | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasInput = isProofreaderSupported && !!text.trim();

  const [state, setState] = useState<ProofreadState>(idleState);

  useEffect(() => {
    if (!hasInput) {
      return;
    }

    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;
    const { signal } = controller;

    const ensureInstance = async (): Promise<Proofreader | null> => {
      if (proofreaderRef.current) {
        return proofreaderRef.current;
      }

      const availability = await Proofreader.availability();

      if (signal.aborted || availability === "unavailable") {
        return null;
      }

      const proofreader = await Proofreader.create({
        expectedInputLanguages: ["en"],
        monitor(m) {
          m.addEventListener("downloadprogress", (event) => {
            setDownload("proofreader", event.loaded);
          });
        },
      });

      if (signal.aborted) {
        return null;
      }

      proofreaderRef.current = proofreader;
      return proofreader;
    };

    const run = async () => {
      setState({ data: null, isLoading: true, error: null });

      try {
        const proofreader = await ensureInstance();

        if (!proofreader) {
          setState(idleState);
          return;
        }

        const result = await proofreader.proofread(text, { signal });

        if (signal.aborted) {
          return;
        }

        setState({
          data: result.correctedInput,
          isLoading: false,
          error: null,
        });
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
  }, [hasInput, text, setDownload]);

  const { data, isLoading, error } = hasInput ? state : idleState;

  return {
    data,
    isLoading,
    error,
    isSupported: isProofreaderSupported,
  };
}
