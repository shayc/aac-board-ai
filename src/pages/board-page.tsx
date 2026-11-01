import { CommunicationBoard, type Board } from "@features/board";
import { useLoaderData } from "react-router";

export function BoardPage() {
  const board = useLoaderData<Board>();

  return (
    <>
      <title>{board.name}</title>
      <CommunicationBoard board={board} />
    </>
  );
}
