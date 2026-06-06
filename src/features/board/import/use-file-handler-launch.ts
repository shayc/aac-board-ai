import { useEffect } from "react";
import { isBoardFile } from "./board-file-types";
import { useImportBoardFiles } from "./use-import-board-files";

export function useFileHandlerLaunch(): void {
  const { importBoardFiles } = useImportBoardFiles();

  useEffect(() => {
    const queue = window.launchQueue;
    if (!queue) {
      return;
    }

    queue.setConsumer(({ files }) => {
      void Promise.all(files.map((handle) => handle.getFile())).then((opened) =>
        importBoardFiles(opened.filter(isBoardFile)),
      );
    });
  }, [importBoardFiles]);
}
