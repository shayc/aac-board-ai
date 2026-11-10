import type { boardLoader } from "@app/routing/loaders/board-loader";
import {
  BOARD_SET_ROUTE_ID,
  type boardSetLoader,
} from "@app/routing/loaders/board-set-loader";
import { CommunicationBoard, useBoardInLanguage } from "@features/board";
import { useLoaderData, useRouteLoaderData } from "react-router";

export function BoardPage() {
  const board = useBoardInLanguage(useLoaderData<typeof boardLoader>());
  const rootBoardId =
    useRouteLoaderData<typeof boardSetLoader>(BOARD_SET_ROUTE_ID)?.rootBoardId;

  return (
    <>
      <title>{board.name}</title>
      <CommunicationBoard board={board} rootBoardId={rootBoardId} />
    </>
  );
}
