import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useNavigate } from "react-router";
import { rootBoardPath } from "../navigation/board-paths";
import { BOARD_FILE_ACCEPT, hasBoardFileExtension } from "./board-file-formats";
import { importEachBoardFile, type ImportedBoardSet } from "./board-import";
import { pickFiles } from "./pick-files";
import { summarizeImport } from "./summarize-import";

interface UseImportBoardFilesReturn {
  pickAndImport: () => Promise<void>;
  importFiles: (files: File[]) => Promise<ImportedBoardSet[]>;
  importAndOpen: (files: File[]) => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  async function importFiles(files: File[]): Promise<ImportedBoardSet[]> {
    if (files.length === 0) {
      return [];
    }

    const boardFiles = files.filter(hasBoardFileExtension);

    if (boardFiles.length === 0) {
      showSnackbar({
        message: (t) => t(m.libraryImportOnlyBoardFiles),
        severity: "error",
      });
      return [];
    }

    showSnackbar({
      message: (t) =>
        t(m.libraryImportingBoardFiles, { count: boardFiles.length }),
    });

    const outcome = await importEachBoardFile(boardFiles);
    showSnackbar(summarizeImport(outcome));

    return outcome.importedBoardSets;
  }

  async function importAndOpen(files: File[]) {
    const importedBoardSets = await importFiles(files);

    if (importedBoardSets.length !== 1) {
      return;
    }

    const [boardSet] = importedBoardSets;
    void navigate(rootBoardPath(boardSet));
  }

  async function pickAndImport() {
    const files = await pickFiles({
      accept: BOARD_FILE_ACCEPT,
      multiple: true,
    });

    await importFiles(files);
  }

  return {
    pickAndImport,
    importFiles,
    importAndOpen,
  };
}
