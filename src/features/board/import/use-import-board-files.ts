import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { openFiles } from "@shared/utils/file-picker";
import { BOARD_FILE_ACCEPT } from "./board-file-types";
import { importBoardFiles as importBoardFilesToStorage } from "./board-import";

export interface UseImportBoardFilesReturn {
  pickAndImportBoardFiles: () => Promise<void>;
  importBoardFiles: (files: File[]) => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();

  async function importBoardFiles(files: File[]) {
    if (files.length === 0) {
      return;
    }

    const count = files.length;

    showSnackbar({
      message: m.libraryImportingBoards({ count }),
    });

    try {
      await importBoardFilesToStorage(files);

      showSnackbar({
        message: m.libraryImportedBoards({ count }),
        severity: "success",
      });
    } catch (error) {
      showSnackbar({
        message: m.libraryImportFailedBoards({ count }),
        severity: "error",
      });

      throw error;
    }
  }

  async function pickAndImportBoardFiles() {
    const files = await openFiles({
      accept: BOARD_FILE_ACCEPT,
      multiple: true,
    });

    await importBoardFiles(files);
  }

  return { pickAndImportBoardFiles, importBoardFiles };
}
