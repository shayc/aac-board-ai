import { useSnackbar } from "@shared/snackbar/use-snackbar";
import { useEffect, useEffectEvent } from "react";
import {
  importOutcomeSnackbar,
  useImportBoardFiles,
} from "./use-import-board-files";

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
      } catch (error) {
        const failures = handles.map(({ name }) => ({ fileName: name, error }));
        showSnackbar(
          importOutcomeSnackbar({ importedBoardSets: [], failures }),
        );
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
