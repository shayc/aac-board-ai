import { CommunicationBoard } from "@features/board";
import { useBoardInLanguage } from "@features/library";
import { useLoaderData, useRouteLoaderData } from "react-router";
import type { boardLoader } from "./board-loader";
import { BOARD_SET_ROUTE_ID, type boardSetLoader } from "./board-set-loader";

export function BoardPage() {
  const { board, language } =
    useBoardInLanguage(useLoaderData<typeof boardLoader>());
  const rootBoardId =
    useRouteLoaderData<typeof boardSetLoader>(BOARD_SET_ROUTE_ID)?.rootBoardId;

  return (
    <>
      <title>{board.name}</title>
      <CommunicationBoard
        board={board}
        language={language}
        rootBoardId={rootBoardId}
      />
    </>
  );
}
