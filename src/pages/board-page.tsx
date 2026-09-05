import type { BoardRouteData } from "@app/routing/loaders/board-loader";
import { CommunicationBoard } from "@features/board";
import { useLoaderData } from "react-router";

export function BoardPage() {
  const { board, setId } = useLoaderData<BoardRouteData>();

  return <CommunicationBoard board={board} setId={setId} />;
}
