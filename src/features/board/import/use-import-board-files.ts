import { m } from "@paraglide/messages.js";
import { usePerfSpan } from "@perf";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { OBFError } from "@shayc/open-board-format";
import { useNavigate } from "react-router";
import { rootBoardPath } from "../navigation/board-paths";
import { BOARD_FILE_ACCEPT } from "./board-file-formats";
import { importBoardFiles, type ImportedBoardSet } from "./board-import";
import { pickFiles } from "./pick-files";

interface UseImportBoardFilesReturn {
  pickAndImport: () => Promise<void>;
  importFiles: (files: File[]) => Promise<ImportedBoardSet[] | undefined>;
  importAndOpen: (files: File[]) => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const importSpan = usePerfSpan("flow:library:import");

  async function importFiles(
    files: File[],
  ): Promise<ImportedBoardSet[] | undefined> {
    if (files.length === 0) {
      return [];
    }

    const count = files.length;

    importSpan.start();
    showSnackbar({
      message: (t) => t(m.libraryImportingBoardFiles, { count }),
    });

    try {
      const importedBoardSets = await importBoardFiles(files);

      showSnackbar({
        message: (t) => t(m.libraryImportedBoardSets, { count }),
        severity: "success",
      });

      return importedBoardSets;
    } catch (error) {
      const isTooLarge =
        error instanceof OBFError && error.info.code === "archive-too-large";
      const errorMessage = isTooLarge
        ? m.libraryImportTooLargeBoardFiles
        : m.libraryImportFailedBoardFiles;

      showSnackbar({
        message: (t) => t(errorMessage, { count }),
        severity: "error",
      });

      return undefined;
    }
  }

  async function importAndOpen(files: File[]) {
    const importedBoardSets = await importFiles(files);

    if (importedBoardSets?.length !== 1) {
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
