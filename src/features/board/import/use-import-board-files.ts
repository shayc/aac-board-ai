import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { OBFError } from "@shayc/open-board-format";
import { useNavigate } from "react-router";
import { rootBoardPath } from "../navigation/board-paths";
import { BOARD_FILE_ACCEPT, hasBoardFileExtension } from "./board-file-formats";
import { importBoardFile, type ImportedBoardSet } from "./board-import";
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

    const importedBoardSets: ImportedBoardSet[] = [];
    const errors: unknown[] = [];

    for (const file of boardFiles) {
      try {
        importedBoardSets.push(await importBoardFile(file));
      } catch (error) {
        errors.push(error);
      }
    }

    showImportOutcome(importedBoardSets.length, errors);

    return importedBoardSets;
  }

  function showImportOutcome(importedCount: number, errors: unknown[]) {
    if (errors.length === 0) {
      showSnackbar({
        message: (t) => t(m.libraryImportedBoardSets, { count: importedCount }),
        severity: "success",
      });
      return;
    }

    if (importedCount > 0) {
      showSnackbar({
        message: (t) =>
          t(m.libraryImportPartiallyFailed, {
            failed: errors.length,
            total: importedCount + errors.length,
          }),
        severity: "error",
      });
      return;
    }

    const failureMessage = errors.every(isArchiveTooLarge)
      ? m.libraryImportTooLargeBoardFiles
      : m.libraryImportFailedBoardFiles;

    showSnackbar({
      message: (t) => t(failureMessage, { count: errors.length }),
      severity: "error",
    });
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

function isArchiveTooLarge(error: unknown): boolean {
  return error instanceof OBFError && error.info.code === "archive-too-large";
}
