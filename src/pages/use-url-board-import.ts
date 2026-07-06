import { boardSetPath, importBoardFromUrl } from "@features/board";
import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

export type UrlBoardImportState =
  | { status: "importing" }
  | { status: "error"; error: unknown; retry: () => void };

interface ImportOutcome {
  key: string;
  error: unknown;
}

export function useUrlBoardImport(importUrl: string): UrlBoardImportState {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const startedKey = useRef<string | null>(null);
  const key = `${importUrl}:${String(attempt)}`;

  useEffect(() => {
    if (startedKey.current === key) {
      return;
    }
    startedKey.current = key;

    let cancelled = false;

    importBoardFromUrl(importUrl).then(
      (result) => {
        if (cancelled) {
          return;
        }
        if (result.alreadyExisted) {
          showSnackbar({ message: m.importAlreadyInLibrary() });
        }
        void navigate(boardSetPath(result), { replace: true });
      },
      (error: unknown) => {
        if (!cancelled) {
          setOutcome({ key, error });
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [importUrl, key, navigate, showSnackbar]);

  if (outcome?.key === key) {
    return {
      status: "error",
      error: outcome.error,
      retry: () => setAttempt((n) => n + 1),
    };
  }

  return { status: "importing" };
}
