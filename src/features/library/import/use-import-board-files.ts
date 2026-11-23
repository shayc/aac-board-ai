import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useNavigate } from "react-router";
import { rootBoardPath } from "../board-paths";
import { BOARD_FILE_ACCEPT, hasBoardFileExtension } from "./board-file-formats";
import {
  importEachBoardFile,
  type ImportedBoardSet,
  type ImportFailure,
} from "./board-file-import";
import { summarizeImport } from "./summarize-import";

interface UseImportBoardFilesReturn {
  importAndOpen: (
    files: readonly File[],
    readFailures?: readonly ImportFailure[],
  ) => Promise<void>;
  pickAndImport: () => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  async function importAndReport(
    files: readonly File[],
    readFailures: readonly ImportFailure[],
  ): Promise<ImportedBoardSet[]> {
    if (files.length === 0 && readFailures.length === 0) {
      return [];
    }

    const boardFiles = files.filter(({ name }) => hasBoardFileExtension(name));
    const boardReadFailures = readFailures.filter(({ fileName }) =>
      hasBoardFileExtension(fileName),
    );
    if (boardFiles.length === 0 && boardReadFailures.length === 0) {
      showSnackbar({
        message: (t) => t(m.libraryImportNotBoardFiles),
        severity: "error",
      });

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
    readFailures: readonly ImportFailure[] = [],
  ) {
    const importedBoardSets = await importAndReport(files, readFailures);
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
