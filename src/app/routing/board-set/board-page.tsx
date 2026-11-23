import { CommunicationBoard } from "@features/board";
import { useBoardInLanguage } from "@features/library";
import { useScreenWakeLock } from "@shared/hooks/use-screen-wake-lock";
import { useLoaderData, useRouteLoaderData } from "react-router";
import type { boardLoader } from "./board-loader";
import { BOARD_SET_ROUTE_ID, type boardSetLoader } from "./board-set-loader";

export function BoardPage() {
  const { board: storedBoard, restoredMessage } =
    useLoaderData<typeof boardLoader>();
  const board = useBoardInLanguage(storedBoard);
  const rootBoardId =
    useRouteLoaderData<typeof boardSetLoader>(BOARD_SET_ROUTE_ID)?.rootBoardId;

  useScreenWakeLock();

  return (
    <>
      <title>{board.name}</title>
      <CommunicationBoard
        board={board}
        rootBoardId={rootBoardId}
        initialMessage={restoredMessage}
      />
    </>
  );
}
