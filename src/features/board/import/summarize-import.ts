import { m } from "@paraglide/messages.js";
import type { SnackbarOptions } from "@shared/snackbar/snackbar-context";
import { OBFError } from "@shayc/open-board-format";
import type { BoardFilesImportOutcome } from "./board-import";

export function summarizeImport({
  importedBoardSets,
  failures,
}: BoardFilesImportOutcome): SnackbarOptions {
  const importedCount = importedBoardSets.length;

  if (failures.length === 0) {
    return {
      message: (t) => t(m.libraryImportedBoardSets, { count: importedCount }),
      severity: "success",
    };
  }

  if (failures.length === 1) {
    const [{ fileName, error }] = failures;
    const fileFailureMessage = isArchiveTooLarge(error)
      ? m.libraryImportTooLargeBoardFile
      : m.libraryImportFailedBoardFile;

    return {
      message: (t) => t(fileFailureMessage, { fileName }),
      severity: "error",
    };
  }

  if (importedCount > 0) {
    const total = importedCount + failures.length;

    return {
      message: (t) =>
        t(m.libraryImportPartiallyFailedBoardFiles, {
          failed: failures.length,
          total,
        }),
      severity: "error",
    };
  }

  const failureMessage = failures.every(({ error }) => isArchiveTooLarge(error))
    ? m.libraryImportTooLargeBoardFiles
    : m.libraryImportFailedBoardFiles;

  return {
    message: (t) => t(failureMessage),
    severity: "error",
  };
}

function isArchiveTooLarge(error: unknown): boolean {
  return error instanceof OBFError && error.info.code === "archive-too-large";
}
