import { useLanguage } from "@shared/language/use-language";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { openFiles } from "@shared/utils/file-picker";
import { importBoardFiles } from "./board-sets-store";

const BOARD_FILE_ACCEPT = ".obz,.obf,application/zip,application/json";

export interface UseImportBoardFilesReturn {
  pickAndImportBoardFiles: () => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();
  const { m } = useLanguage();

  async function pickAndImportBoardFiles() {
    const files = await openFiles({
      accept: BOARD_FILE_ACCEPT,
      multiple: true,
    });

    if (files.length === 0) {
      return;
    }

    const isPlural = files.length > 1;
    showSnackbar({
      message: isPlural
        ? m.libraryImportingBoards()
        : m.libraryImportingBoard(),
    });

    try {
      await importBoardFiles(files);

      showSnackbar({
        message: isPlural
          ? m.libraryImportedBoards()
          : m.libraryImportedBoard(),
        severity: "success",
      });
    } catch (error) {
      showSnackbar({
        message: isPlural
          ? m.libraryImportFailedBoards()
          : m.libraryImportFailedBoard(),
        severity: "error",
      });
      throw error;
    }
  }

  return { pickAndImportBoardFiles };
}
