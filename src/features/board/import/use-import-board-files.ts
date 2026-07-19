import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { openFiles } from "@shared/utils/file-picker";
import { OBFError } from "@shayc/open-board-format";
import { useNavigate } from "react-router";
import { boardSetPath } from "../navigation/board-paths";
import { BOARD_FILE_ACCEPT } from "./board-file-formats";
import { importBoardSets, type ImportResult } from "./board-import";

interface UseImportBoardFilesReturn {
  pickAndImportBoardFiles: () => Promise<void>;
  importBoardFiles: (files: File[]) => Promise<ImportResult[] | undefined>;
  importAndOpenBoardFiles: (files: File[]) => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  async function importBoardFiles(
    files: File[],
  ): Promise<ImportResult[] | undefined> {
    if (files.length === 0) {
      return [];
    }

    const count = files.length;

    showSnackbar({
      message: (translate) => translate(m.libraryImportingBoards, { count }),
    });

    try {
      const results = await importBoardSets(files);

      showSnackbar({
        message: (translate) => translate(m.libraryImportedBoards, { count }),
        severity: "success",
      });

      return results;
    } catch (error) {
      const tooLarge =
        error instanceof OBFError && error.info.code === "archive-too-large";

      showSnackbar({
        message: tooLarge
          ? (translate) => translate(m.libraryImportTooLargeBoards, { count })
          : (translate) => translate(m.libraryImportFailedBoards, { count }),
        severity: "error",
      });

      return undefined;
    }
  }

  async function importAndOpenBoardFiles(files: File[]) {
    const results = await importBoardFiles(files);

    if (results?.length !== 1) {
      return;
    }

    const [result] = results;
    void navigate(boardSetPath(result));
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
