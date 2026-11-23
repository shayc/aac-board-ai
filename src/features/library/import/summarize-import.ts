import { m } from "@paraglide/messages.js";
import type { SnackbarOptions } from "@shared/snackbar/snackbar-context";
import { OBFError } from "@shayc/open-board-format";
import type { ImportOutcome } from "./board-file-import";

export function summarizeImport({
  importedBoardSets,
  failures,
}: ImportOutcome): SnackbarOptions {
  const importedCount = importedBoardSets.length;
  const failedCount = failures.length;

  if (failedCount === 0) {
    return {
      message: (t) => t(m.libraryImportedBoardSets, { count: importedCount }),
      severity: "success",
    };
  }

  if (importedCount > 0 && failedCount > 1) {
    const total = importedCount + failedCount;

    return {
      message: (t) =>
        t(m.libraryImportPartiallyFailedBoardFiles, {
          failed: failedCount,
          total,
        }),
      severity: "error",
    };
  }

  const failureMessage = failures.every(({ error }) => isArchiveTooLarge(error))
    ? m.libraryImportTooLargeBoardFiles
    : m.libraryImportFailedBoardFiles;

  return {
    message: (t) => t(failureMessage, { count: failedCount }),
    severity: "error",
  };
}

function isArchiveTooLarge(error: unknown): boolean {
  return error instanceof OBFError && error.info.code === "archive-too-large";
}
