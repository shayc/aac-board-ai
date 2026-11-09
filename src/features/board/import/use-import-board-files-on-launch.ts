import { m } from "@paraglide/messages.js";
import type { Translate } from "@shared/language/use-translate";
import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useEffect, useEffectEvent } from "react";
import { useImportBoardFiles } from "./use-import-board-files";

export function useImportBoardFilesOnLaunch(): void {
  const { importAndOpen } = useImportBoardFiles();
  const { showSnackbar } = useSnackbar();

  const importLaunchedFiles = useEffectEvent(
    async (handles: readonly FileSystemFileHandle[]) => {
      try {
        const files = await Promise.all(
          handles.map((handle) => handle.getFile()),
        );
        await importAndOpen(files);
      } catch {
        showSnackbar({
          message: openFailureMessage(handles),
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

function openFailureMessage(
  handles: readonly FileSystemFileHandle[],
): (t: Translate) => string {
  if (handles.length === 1) {
    const [{ name }] = handles;

    return (t) => t(m.libraryImportFailedBoardFile, { fileName: name });
  }

  return (t) => t(m.libraryImportFailedBoardFiles);
}
