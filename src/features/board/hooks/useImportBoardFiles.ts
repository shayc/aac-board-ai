import { importBoardFiles as importFiles } from "@features/board/store/board-sets-store";
import { useSnackbar } from "@shared/contexts/SnackbarProvider/useSnackbar";
import { openFiles } from "@shared/utils/files";
import { generatePath, useNavigate } from "react-router";

export interface UseImportBoardFilesReturn {
  importBoardFiles: () => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const navigate = useNavigate();
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
      const results = await importFiles(files);

      showSnackbar({
        message: isPlural
          ? "Boards imported successfully"
          : "Board imported successfully",
        severity: "success",
      });

      if (results.length === 1) {
        const { setId, boardId } = results[0];
        void navigate(
          generatePath("/sets/:setId/boards/:boardId", { setId, boardId }),
        );
      }
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
