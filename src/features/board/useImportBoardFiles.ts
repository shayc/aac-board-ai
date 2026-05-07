import { useSnackbar } from "@shared/snackbar/useSnackbar";
import { openFiles } from "@shared/utils/file-picker";
import { importBoardFiles } from "./storage/board-sets-store";

const BOARD_FILE_ACCEPT = ".obz,.obf,application/zip,application/json";

export interface UseImportBoardFilesReturn {
  importBoardFiles: () => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();

  async function handleImport() {
    const files = await openFiles({
      accept: BOARD_FILE_ACCEPT,
      multiple: true,
    });

    if (files.length === 0) {
      return;
    }

    const isPlural = files.length > 1;
    showSnackbar({
      message: isPlural ? "Importing boards..." : "Importing board...",
    });

    try {
      await importBoardFiles(files);

      showSnackbar({
        message: isPlural
          ? "Boards imported successfully"
          : "Board imported successfully",
        severity: "success",
      });
    } catch {
      showSnackbar({
        message: isPlural
          ? "Failed to import boards"
          : "Failed to import board",
        severity: "error",
      });
    }
  }

  return { importBoardFiles: handleImport };
}
