import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { openFiles } from "@shared/utils/file-picker";
import { useNavigate } from "react-router";
import { boardSetPath } from "../navigation/board-paths";
import { BOARD_FILE_ACCEPT } from "./board-file-types";
import { importBoardSets, type ImportResult } from "./board-import";

export interface UseImportBoardFilesReturn {
  pickAndImportBoardFiles: () => Promise<void>;
  importBoardFiles: (files: File[]) => Promise<ImportResult[]>;
  importAndOpenBoardFiles: (files: File[]) => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  async function importBoardFiles(files: File[]): Promise<ImportResult[]> {
    if (files.length === 0) {
      return [];
    }

    const count = files.length;

    showSnackbar({
      message: m.libraryImportingBoards({ count }),
    });

    try {
      const results = await importBoardSets(files);

      const importedCount = results.filter(
        (result) => !result.alreadyExisted,
      ).length;

      showSnackbar({
        message:
          importedCount === 0
            ? m.importAlreadyInLibrary()
            : m.libraryImportedBoards({ count: importedCount }),
        severity: "success",
      });

      return results;
    } catch (error) {
      showSnackbar({
        message: m.libraryImportFailedBoards({ count }),
        severity: "error",
      });

      throw error;
    }
  }

  async function importAndOpenBoardFiles(files: File[]) {
    const results = await importBoardFiles(files);

    if (results.length === 1) {
      const [result] = results;
      void navigate(boardSetPath(result));
    }
  }

  async function pickAndImportBoardFiles() {
    const files = await openFiles({
      accept: BOARD_FILE_ACCEPT,
      multiple: true,
    });

    await importBoardFiles(files);
  }

  return {
    pickAndImportBoardFiles,
    importBoardFiles,
    importAndOpenBoardFiles,
  };
}
