import type { RootIndexLoaderData } from "@app/routing/loaders/root-index-loader";
import {
  boardSetPath,
  BoardFileTooLargeError,
  UnsupportedBoardUrlError,
  useBoardSets,
} from "@features/board";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { m } from "@paraglide/messages.js";
import { ErrorState } from "@shared/components/error-state";
import { LoadingState } from "@shared/components/loading-state";
import { OBFError } from "@shayc/open-board-format";
import { useLoaderData, useNavigate } from "react-router";
import { useUrlBoardImport } from "./use-url-board-import";

function describeImportError(error: unknown): string | undefined {
  if (error instanceof UnsupportedBoardUrlError) {
    return m.importUrlNotSupported();
  }

  if (
    error instanceof BoardFileTooLargeError ||
    (error instanceof OBFError && error.info.code === "archive-too-large")
  ) {
    return m.importTooLarge();
  }

  return undefined;
}

export const Component = function RootIndexPage() {
  const { importUrl } = useLoaderData<RootIndexLoaderData>();
  const state = useUrlBoardImport(importUrl);
  const { boardSets } = useBoardSets();
  const navigate = useNavigate();

  if (state.status === "importing") {
    return <LoadingState />;
  }

  return (
    <ErrorState
      title={m.importFailedTitle()}
      description={describeImportError(state.error)}
      action={
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={state.retry}>
            {m.importRetry()}
          </Button>
          {boardSets.length > 0 && (
            <Button onClick={() => void navigate(boardSetPath(boardSets[0]))}>
              {m.importGoToBoards()}
            </Button>
          )}
        </Stack>
      }
    />
  );
};
