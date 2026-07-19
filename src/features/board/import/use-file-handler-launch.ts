import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useEffect } from "react";
import { isBoardFile } from "./board-file-formats";
import { useImportBoardFiles } from "./use-import-board-files";

export function useFileHandlerLaunch(): void {
  const { importAndOpenBoardFiles } = useImportBoardFiles();
  const { showSnackbar } = useSnackbar();

  useEffect(() => {
    const queue = window.launchQueue;
    if (!queue) {
      return;
    }

    async function importFileHandles(handles: readonly FileSystemFileHandle[]) {
      try {
        const opened = await Promise.all(
          handles.map((handle) => handle.getFile()),
        );
        await importAndOpenBoardFiles(opened.filter(isBoardFile));
      } catch {
        showSnackbar({
          message: (translate) =>
            translate(m.libraryImportFailedBoards, { count: handles.length }),
          severity: "error",
        });
      }
    }

    queue.setConsumer(({ files }) => {
      void importFileHandles(files);
    });
  }, [importAndOpenBoardFiles, showSnackbar]);
}
