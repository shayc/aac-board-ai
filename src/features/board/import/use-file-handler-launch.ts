import { useEffect } from "react";
import { isBoardFile } from "./board-file-formats";
import { useImportBoardFiles } from "./use-import-board-files";

export function useFileHandlerLaunch(): void {
  const { importAndOpenBoardFiles } = useImportBoardFiles();

  useEffect(() => {
    const queue = window.launchQueue;
    if (!queue) {
      return;
    }

    queue.setConsumer(({ files }) => {
      void Promise.all(files.map((handle) => handle.getFile())).then((opened) =>
        importAndOpenBoardFiles(opened.filter(isBoardFile)),
      );
    });
  }, [importAndOpenBoardFiles]);
}
