import { boardSetPath, importBoardFromUrl } from "@features/board";
import { m } from "@paraglide/messages.js";
import { useLatestAsync } from "@shared/hooks/use-latest-async";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

export type UrlBoardImportState =
  | { status: "importing" }
  | { status: "error"; error: unknown; retry: () => void };

export function useUrlBoardImport(importUrl: string): UrlBoardImportState {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(0);

  const { value, error } = useLatestAsync({
    enabled: true,
    deps: [importUrl, attempt],
    fetch: (signal) => importBoardFromUrl(importUrl, signal),
  });

  useEffect(() => {
    if (!value) {
      return;
    }
    if (value.alreadyExisted) {
      showSnackbar({ message: m.importAlreadyInLibrary() });
    }
    void navigate(boardSetPath(value), { replace: true });
  }, [value, navigate, showSnackbar]);

  if (error) {
    return { status: "error", error, retry: () => setAttempt((n) => n + 1) };
  }
  return { status: "importing" };
}
