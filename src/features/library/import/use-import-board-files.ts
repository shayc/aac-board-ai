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
import { summarizeImport, summarizeSkippedImport } from "./summarize-import";

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

    const boardFiles = files.filter(({ name }) => hasBoardFileExtension(name));
    const boardReadFailures = readFailures.filter(({ fileName }) =>
      hasBoardFileExtension(fileName),
    );
    if (boardFiles.length === 0 && boardReadFailures.length === 0) {
      const skippedFileNames = [
        ...files.map(({ name }) => name),
        ...readFailures.map(({ fileName }) => fileName),
      ];
      showSnackbar(summarizeSkippedImport(skippedFileNames));

      return [];
    }

    if (boardFiles.length > 0) {
      showSnackbar({
        message: (t) =>
          t(m.libraryImportingBoardFiles, { count: boardFiles.length }),
      });
    }

    const outcome = await importEachBoardFile(boardFiles);
    showSnackbar(
      summarizeImport({
        importedBoardSets: outcome.importedBoardSets,
        failures: [...boardReadFailures, ...outcome.failures],
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

    input.showPicker();
  });
}
