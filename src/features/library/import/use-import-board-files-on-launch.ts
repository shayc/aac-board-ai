import { useEffect, useEffectEvent } from "react";
import type { ImportFailure } from "./board-file-import";
import { useImportBoardFiles } from "./use-import-board-files";

export function useImportBoardFilesOnLaunch(): void {
  const { importAndOpen } = useImportBoardFiles();

  const importLaunchedFiles = useEffectEvent(
    async (handles: readonly FileSystemFileHandle[]) => {
      const readResults = await Promise.all(handles.map(readLaunchedFile));
      const files = readResults.filter((entry) => entry instanceof File);
      const readFailures = readResults.filter(
        (entry): entry is ImportFailure => !(entry instanceof File),
      );

      await importAndOpen(files, readFailures);
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

async function readLaunchedFile(
  handle: FileSystemFileHandle,
): Promise<File | ImportFailure> {
  try {
    return await handle.getFile();
  } catch (error) {
    return { fileName: handle.name, error };
  }
}
