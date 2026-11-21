import { useEffect, useEffectEvent } from "react";
import { useLocation, useNavigate } from "react-router";
import type { ImportFailure } from "./board-file-import";
import { useImportBoardFiles } from "./use-import-board-files";

// Matches the manifest's start_url.
const START_PATH = "/";

export function useLaunchHandler(): void {
  const { importAndOpen } = useImportBoardFiles();
  const navigate = useNavigate();
  const location = useLocation();

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

  const openLaunchedLink = useEffectEvent((targetURL: string) => {
    const { pathname, search } = new URL(targetURL);
    const targetPath = pathname + search;
    // A launch from the app's icon targets the start URL; one that opens a
    // window targets the page already shown. Neither is a link to follow.
    const isLinkToFollow =
      targetPath !== START_PATH &&
      targetPath !== location.pathname + location.search;
    if (!isLinkToFollow) {
      return;
    }

    void navigate(targetPath);
  });

  useEffect(() => {
    const queue = window.launchQueue;
    if (!queue) {
      return;
    }

    // The manifest's launch_handler focuses the open window without navigating
    // it, so every launch is handled here.
    queue.setConsumer(({ files, targetURL }) => {
      if (files.length > 0) {
        void importLaunchedFiles(files);

        return;
      }

      if (targetURL) {
        openLaunchedLink(targetURL);
      }
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
