import { m } from "@paraglide/messages.js";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useEffect, useEffectEvent } from "react";
import { isBoardFile } from "./board-file-formats";
import { useImportBoardFiles } from "./use-import-board-files";

export function useImportLaunchedBoardFiles(): void {
  const { importAndOpenBoardFiles } = useImportBoardFiles();
  const { showSnackbar } = useSnackbar();

  const importLaunchedFiles = useEffectEvent(
    async (handles: readonly FileSystemFileHandle[]) => {
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
    },
  );

  useEffect(() => {
    const queue = window.launchQueue;
    if (!queue) {
      return;
    }

    queue.setConsumer(({ files }) => {
      void importLaunchedFiles(files);
    });
  }, []);
}
