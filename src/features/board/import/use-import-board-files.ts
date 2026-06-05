import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { openFiles } from "@shared/utils/file-picker";
import { importBoardFiles } from "./board-import";

const BOARD_FILE_ACCEPT =
  ".obz,.obf,.zip,.json,application/zip,application/json,application/octet-stream";

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

    const count = files.length;

    showSnackbar({
      message: m.libraryImportingBoards({ count }),
    });

    try {
      await importBoardFiles(files);

      showSnackbar({
        message: m.libraryImportedBoards({ count }),
        severity: "success",
      });
    } catch {
      showSnackbar({
        message: m.libraryImportFailedBoards({ count }),
        severity: "error",
      });
    }
  }

  return { pickAndImportBoardFiles };
}
