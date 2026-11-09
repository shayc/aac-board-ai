import { m } from "@paraglide/messages.js";
import type { SnackbarOptions } from "@shared/snackbar/snackbar-context";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { OBFError } from "@shayc/open-board-format";
import { useNavigate } from "react-router";
import { rootBoardPath } from "../navigation/board-paths";
import { BOARD_FILE_ACCEPT, hasBoardFileExtension } from "./board-file-formats";
import {
  importBoardFiles,
  type BoardFilesImportOutcome,
  type ImportedBoardSet,
} from "./board-import";
import { pickFiles } from "./pick-files";

interface UseImportBoardFilesReturn {
  pickAndImport: () => Promise<void>;
  importFiles: (files: File[]) => Promise<ImportedBoardSet[]>;
  importAndOpen: (files: File[]) => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  async function importFiles(files: File[]): Promise<ImportedBoardSet[]> {
    if (files.length === 0) {
      return [];
    }

    const boardFiles = files.filter(hasBoardFileExtension);

    if (boardFiles.length === 0) {
      showSnackbar({
        message: (t) => t(m.libraryImportOnlyBoardFiles),
        severity: "error",
      });
      return [];
    }

    showSnackbar({
      message: (t) =>
        t(m.libraryImportingBoardFiles, { count: boardFiles.length }),
    });

    const outcome = await importBoardFiles(boardFiles);
    showSnackbar(importOutcomeSnackbar(outcome));

    return outcome.importedBoardSets;
  }

  async function importAndOpen(files: File[]) {
    const importedBoardSets = await importFiles(files);

    if (importedBoardSets.length !== 1) {
      return;
    }

    const [boardSet] = importedBoardSets;
    void navigate(rootBoardPath(boardSet));
  }

  async function pickAndImport() {
    const files = await pickFiles({
      accept: BOARD_FILE_ACCEPT,
      multiple: true,
    });

    await importFiles(files);
  }

  return {
    pickAndImport,
    importFiles,
    importAndOpen,
  };
}

export function importOutcomeSnackbar({
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
    const failureMessage = isArchiveTooLarge(error)
      ? m.libraryImportTooLargeBoardFile
      : m.libraryImportFailedBoardFile;

    return {
      message: (t) => t(failureMessage, { fileName }),
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
