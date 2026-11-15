import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useNavigate } from "react-router";
import { rootBoardPath } from "../board-paths";
import { BOARD_FILE_ACCEPT, hasBoardFileExtension } from "./board-file-formats";
import {
  type BoardFileImportFailure,
  importEachBoardFile,
  type ImportedBoardSet,
} from "./board-file-import";
import { summarizeImport } from "./summarize-import";

interface UseImportBoardFilesReturn {
  importAndOpen: (
    files: readonly File[],
    readFailures?: readonly BoardFileImportFailure[],
  ) => Promise<void>;
  pickAndImport: () => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  async function importFiles(
    files: readonly File[],
    readFailures: readonly BoardFileImportFailure[],
  ): Promise<ImportedBoardSet[]> {
    if (files.length === 0 && readFailures.length === 0) {
      return [];
    }

    const boardFileCount = files.filter(hasBoardFileExtension).length;
    if (boardFileCount > 0) {
      showSnackbar({
        message: (t) =>
          t(m.libraryImportingBoardFiles, { count: boardFileCount }),
      });
    }

    const outcome = await importEachBoardFile(files);
    showSnackbar(
      summarizeImport({
        importedBoardSets: outcome.importedBoardSets,
        failures: [...readFailures, ...outcome.failures],
      }),
    );

    return outcome.importedBoardSets;
  }

  async function importAndOpen(
    files: readonly File[],
    readFailures: readonly BoardFileImportFailure[] = [],
  ) {
    const importedBoardSets = await importFiles(files, readFailures);
    const onlyBoardSet =
      importedBoardSets.length === 1 ? importedBoardSets[0] : undefined;
    if (!onlyBoardSet) {
      return;
    }

    void navigate(rootBoardPath(onlyBoardSet));
  }

  async function pickAndImport() {
    const files = await pickBoardFiles();

    await importAndOpen(files);
  }

  return {
    importAndOpen,
    pickAndImport,
  };
}

function pickBoardFiles(): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = BOARD_FILE_ACCEPT;

    input.addEventListener(
      "change",
      () => resolve(Array.from(input.files ?? [])),
      { once: true },
    );
    input.addEventListener("cancel", () => resolve([]), { once: true });

    // Unlike showPicker(), click() never throws when a picker is already open.
    input.click();
  });
}
