import type { boardLoader } from "@app/routing/loaders/board-loader";
import { CommunicationBoard } from "@features/board";
import { useLoaderData } from "react-router";

export function BoardPage() {
  const board = useLoaderData<typeof boardLoader>();

  return (
    <>
      <title>{board.name}</title>
      <CommunicationBoard board={board} />
    </>
  );
}
