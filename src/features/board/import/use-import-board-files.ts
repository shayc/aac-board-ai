import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { openFiles } from "@shared/utils/file-picker";
import { importBoardFiles } from "./board-import";

const BOARD_FILE_ACCEPT = ".obz,.obf,application/zip,application/json";

export interface UseImportBoardFilesReturn {
  pickAndImportBoardFiles: () => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();

  async function pickAndImportBoardFiles() {
    const files = await openFiles({
      accept: BOARD_FILE_ACCEPT,
      multiple: true,
    });

    if (files.length === 0) {
      return;
    }

    const isPlural = files.length > 1;
    const pickMessage = (single: string, plural: string) =>
      isPlural ? plural : single;

    showSnackbar({
      message: pickMessage(
        m.libraryImportingBoard(),
        m.libraryImportingBoards(),
      ),
    });

    try {
      await importBoardFiles(files);

      showSnackbar({
        message: pickMessage(
          m.libraryImportedBoard(),
          m.libraryImportedBoards(),
        ),
        severity: "success",
      });
    } catch {
      showSnackbar({
        message: pickMessage(
          m.libraryImportFailedBoard(),
          m.libraryImportFailedBoards(),
        ),
        severity: "error",
      });
    }
  }

  return { pickAndImportBoardFiles };
}
