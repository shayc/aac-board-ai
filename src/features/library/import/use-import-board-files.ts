import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useNavigate } from "react-router";
import { rootBoardPath } from "../board-paths";
import { BOARD_FILE_ACCEPT, hasBoardFileExtension } from "./board-file-formats";
import {
  importEachBoardFile,
  type ImportedBoardSet,
} from "./board-file-import";
import { summarizeImport } from "./summarize-import";

interface UseImportBoardFilesReturn {
  importFiles: (files: readonly File[]) => Promise<ImportedBoardSet[]>;
  importAndOpen: (files: readonly File[]) => Promise<void>;
  pickAndImport: () => Promise<void>;
}

export function useImportBoardFiles(): UseImportBoardFilesReturn {
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  async function importFiles(
    files: readonly File[],
  ): Promise<ImportedBoardSet[]> {
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

  async function importAndOpen(files: readonly File[]) {
    const importedBoardSets = await importFiles(files);
    const onlyBoardSet =
      importedBoardSets.length === 1 ? importedBoardSets[0] : undefined;
    if (!onlyBoardSet) {
      return;
    }

    void navigate(rootBoardPath(onlyBoardSet));
  }

  async function pickAndImport() {
    const files = await pickBoardFiles();

    await importFiles(files);
  }

  return {
    importFiles,
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
