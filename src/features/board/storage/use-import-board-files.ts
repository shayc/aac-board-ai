import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { openFiles } from "@shared/utils/file-picker";
import { importBoardFiles } from "./board-sets-store";

const BOARD_FILE_ACCEPT = ".obz,.obf,application/zip,application/json";

export interface UseImportBoardFilesReturn {
  pickAndImportBoardFiles: () => Promise<void>;
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
        message: isPlural ? "Boards imported" : "Board imported",
        severity: "success",
      });
    } catch {
      showSnackbar({
        message: isPlural ? "Couldn't import boards" : "Couldn't import board",
        severity: "error",
      });
    }
  }

  return { pickAndImportBoardFiles: handleImport };
}
