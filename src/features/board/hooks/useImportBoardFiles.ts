import { importBoardFiles as importFiles } from "../store/board-sets-store";
import { useSnackbar } from "@shared/contexts/SnackbarProvider/useSnackbar";
import { openFiles } from "@shared/utils/files";

export interface UseImportBoardFilesReturn {
  importBoardFiles: () => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();

  async function importBoardFiles() {
    const files = await openFiles();

    if (files.length === 0) {
      return;
    }

    const isPlural = files.length > 1;
    showSnackbar({
      message: isPlural ? "Importing boards..." : "Importing board...",
    });

    try {
      await importFiles(files);

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

  return { importBoardFiles };
}
