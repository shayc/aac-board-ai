import { useEffect, useEffectEvent } from "react";
import type { BoardFileImportFailure } from "./board-file-import";
import { useImportBoardFiles } from "./use-import-board-files";

export function useImportBoardFilesOnLaunch(): void {
  const { importAndOpen } = useImportBoardFiles();

  const importLaunchedFiles = useEffectEvent(
    async (handles: readonly FileSystemFileHandle[]) => {
      const reads = await Promise.all(handles.map(readLaunchedFile));
      const files = reads.filter((read) => read instanceof File);
      const readFailures = reads.filter(
        (read): read is BoardFileImportFailure => !(read instanceof File),
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
): Promise<File | BoardFileImportFailure> {
  try {
    return await handle.getFile();
  } catch (error) {
    return { fileName: handle.name, error };
  }
}
